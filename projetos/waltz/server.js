require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const { sql } = require('@vercel/postgres');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
    name: 'sessao-automacao',
    keys: [process.env.CHAVE_SECRETA_SESSAO],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, 
    sameSite: 'lax' 
}));

// Serve a pasta 'public' onde estão seus arquivos HTML, CSS, JS e imagens
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar: Faz o servidor "dormir" por alguns milissegundos para não ser bloqueado
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ==========================================
// ROTA: VERIFICADOR DE SESSÃO (Evita dados na URL ao dar F5)
// ==========================================
app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.logado) {
        res.json({ logado: true });
    } else {
        res.json({ logado: false });
    }
});

// ==========================================
// ROTAS DE LOGIN E LOGOUT
// ==========================================
app.post('/api/login', (req, res) => {
    if (req.body.usuario === 'ame' && req.body.senha === 'Ame@220520') {
        req.session.logado = true; 
        res.json({ sucesso: true });
    } else { 
        res.json({ sucesso: false }); 
    }
});

app.get('/api/logout', (req, res) => { 
    req.session = null; 
    res.json({ sucesso: true }); 
});

// ==========================================
// ROTA: PEDIDOS NUVEMSHOP
// ==========================================
app.get('/api/pedidos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });

    const NUVEMSHOP_APP_ID = process.env.NUVEMSHOP_APP_ID;
    const USER_AGENT = 'Waltz (murielpereirabr@gmail.com)';

    try {
        const resposta = await fetch('https://api.nuvemshop.com.br/v1/orders', {
            headers: {
                'Authentication': `bearer ${process.env.NUVEMSHOP_TOKEN}`,
                'User-Agent': USER_AGENT
            }
        });
        
        if (!resposta.ok) throw new Error("Falha na Nuvemshop");
        
        const pedidos = await resposta.json();
        res.json(pedidos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar pedidos na Nuvemshop' });
    }
});

// ==========================================
// A INTELIGÊNCIA DO WEBHOOK (Cria o cliente se não existir)
// ==========================================
app.post('/api/webhook/tiny', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) return res.status(200).send('OK');

        const dados = payload.dados;
        if (dados && dados.id && dados.cliente && dados.cliente.cpfCnpj) {
            console.log(`\n📦 NOVO PEDIDO: ${dados.id} | CPF: ${dados.cliente.cpfCnpj}`);
            await processarGrupoClienteTiny(dados.id, dados.cliente.cpfCnpj);
        }
        res.status(200).send('OK');
    } catch (erro) {
        console.error("❌ Erro Webhook:", erro);
        res.status(200).send('OK'); 
    }
});

async function processarGrupoClienteTiny(idPedido, cpfBruto) {
    const TOKEN = process.env.TINY_TOKEN;
    const cpfLimpo = cpfBruto.replace(/\D/g, '');

    try {
        // Busca TODOS os pedidos desse CPF no Tiny
        const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`;
        const respostaBusca = await fetch(urlBusca);
        const textoResposta = await respostaBusca.text();
        
        try {
            const dadosBusca = JSON.parse(textoResposta);

            if (dadosBusca.retorno && dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
                const totalPedidos = dadosBusca.retorno.pedidos.length;
                const valorTotalGasto = dadosBusca.retorno.pedidos.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);

                // Extrai os dados cadastrais do cliente direto do pedido mais recente
                const infoCliente = dadosBusca.retorno.pedidos[0].pedido.cliente;
                const nome = infoCliente.nome || 'Cliente Importado';
                const cidade = infoCliente.cidade || '-';
                const uf = infoCliente.uf || '-';
                const telefone = infoCliente.fone || infoCliente.celular || '-';

                // O COMANDO UPSERT: Insere o cliente novo. Se o CPF já existir, ele só atualiza os dados!
                await sql`
                    INSERT INTO clientes (cpf, nome, cidade, estado, telefone, total_pedidos, valor_total)
                    VALUES (${cpfLimpo}, ${nome}, ${cidade}, ${uf}, ${telefone}, ${totalPedidos}, ${valorTotalGasto})
                    ON CONFLICT (cpf) DO UPDATE SET 
                        nome = EXCLUDED.nome,
                        cidade = EXCLUDED.cidade,
                        estado = EXCLUDED.estado,
                        telefone = EXCLUDED.telefone,
                        total_pedidos = EXCLUDED.total_pedidos,
                        valor_total = EXCLUDED.valor_total;
                `;

                let grupo = "PRIMEIRA COMPRA";
                if (totalPedidos > 1) {
                    if (valorTotalGasto <= 1000) grupo = "BRONZE";
                    else if (valorTotalGasto <= 3000) grupo = "PRATA";
                    else if (valorTotalGasto <= 6000) grupo = "OURO";
                    else grupo = "DIAMANTE";
                }

                console.log(`📢 Cliente CPF ${cpfLimpo} importado/atualizado via Webhook: [${grupo}] (R$ ${valorTotalGasto.toFixed(2)})`);
            }
        } catch (jsonErro) {
            console.error(`⚠️ Tiny retornou texto ao invés de JSON no Webhook (Possível bloqueio).`);
        }
    } catch (erro) {
        console.error("❌ Falha na API do Tiny ou Banco durante Webhook:", erro);
    }
}

// ==========================================
// ROTAS DE RELATÓRIOS E BANCO DE DADOS
// ==========================================
app.get('/api/relatorios/clientes', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows } = await sql`SELECT * FROM clientes ORDER BY nome ASC`;
        res.json({ sucesso: true, clientes: rows });
    } catch (erro) {
        res.status(500).json({ sucesso: false });
    }
});

// ==========================================
// ROTA: SINCRONIZAÇÃO EM LOTES (Com filtro de "Apenas Clientes")
// ==========================================
app.post('/api/relatorios/sincronizar-contatos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const TOKEN = process.env.TINY_TOKEN;
    const paginaAtual = (req.body && req.body.pagina) ? req.body.pagina : 1; 
    const paginasPorLote = 3; 

    try {
        let pagina = paginaAtual;
        let salvosNesteLote = 0;
        let ignoradosNesteLote = 0;
        let totalPaginasTiny = 1;
        let terminou = false;

        while (pagina < paginaAtual + paginasPorLote) {
            const urlBusca = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resposta = await fetch(urlBusca);
            const textoResposta = await resposta.text();
            
            try {
                const dados = JSON.parse(textoResposta);

                if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.contatos) {
                    totalPaginasTiny = dados.retorno.numero_paginas;
                    
                    for (const item of dados.retorno.contatos) {
                        const c = item.contato;
                        
                        // FILTRO INTELIGENTE: Verifica se é cliente
                        const tiposDeContato = JSON.stringify(c.tipos_contato || '').toLowerCase();
                        
                        // Ignora se não for explicitamente "cliente"
                        if (tiposDeContato !== '""' && !tiposDeContato.includes('cliente')) {
                            ignoradosNesteLote++;
                            continue; 
                        }

                        const cpfLimpo = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : null;
                        
                        if (cpfLimpo) {
                            const telefone = c.celular || c.fone || '-';
                            await sql`
                                INSERT INTO clientes (cpf, nome, cidade, estado, telefone)
                                VALUES (${cpfLimpo}, ${c.nome}, ${c.cidade || '-'}, ${c.uf || '-'}, ${telefone})
                                ON CONFLICT (cpf) DO UPDATE SET 
                                    nome = EXCLUDED.nome,
                                    telefone = EXCLUDED.telefone;
                            `;
                            salvosNesteLote++;
                        }
                    }
                    if (pagina >= totalPaginasTiny) { terminou = true; break; }
                    pagina++;
                } else { 
                    terminou = true; break; 
                }
            } catch (parseErro) {
                console.error(`⚠️ Tiny bloqueou a leitura da página ${pagina}.`);
                terminou = true; break;
            }
            
            await delay(500); // Pausa leve para não sobrecarregar o Tiny
        }
        
        console.log(`Lote finalizado. Salvos: ${salvosNesteLote} | Ignorados (Fornecedores/Outros): ${ignoradosNesteLote}`);
        res.json({ sucesso: true, proximaPagina: pagina, concluiu: terminou, salvosNesteLote });
        
    } catch (erro) { 
        console.error("Erro no lote de sincronização:", erro);
        res.status(500).json({ sucesso: false, erro: 'Falha no lote.' }); 
    }
});

// ==========================================
// ROTA: CÁLCULO DE HISTÓRICO FINANCEIRO EM LOTE (Com Delay Anti-Bloqueio)
// ==========================================
app.post('/api/relatorios/calcular-lote-financeiro', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const TOKEN = process.env.TINY_TOKEN;
    const cpfs = req.body.cpfs; 
    let atualizados = 0;

    try {
        for (const cpf of cpfs) {
            const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpf}&formato=JSON`;
            const resposta = await fetch(urlBusca);
            const textoResposta = await resposta.text();
            
            try {
                const dados = JSON.parse(textoResposta);

                if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.pedidos) {
                    const totalPedidos = dados.retorno.pedidos.length;
                    const valorTotalGasto = dados.retorno.pedidos.reduce((acumulador, p) => acumulador + parseFloat(p.pedido.valor || 0), 0);

                    // Extrai os dados do pedido para garantir que o cliente exista no banco
                    const infoCliente = dados.retorno.pedidos[0].pedido.cliente;
                    const nome = infoCliente.nome || 'Cliente Importado';
                    const cidade = infoCliente.cidade || '-';
                    const uf = infoCliente.uf || '-';
                    const telefone = infoCliente.fone || infoCliente.celular || '-';

                    // UPSERT: Mesma lógica de proteção do Webhook
                    await sql`
                        INSERT INTO clientes (cpf, nome, cidade, estado, telefone, total_pedidos, valor_total)
                        VALUES (${cpf}, ${nome}, ${cidade}, ${uf}, ${telefone}, ${totalPedidos}, ${valorTotalGasto})
                        ON CONFLICT (cpf) DO UPDATE SET 
                            nome = EXCLUDED.nome,
                            cidade = EXCLUDED.cidade,
                            estado = EXCLUDED.estado,
                            telefone = EXCLUDED.telefone,
                            total_pedidos = EXCLUDED.total_pedidos,
                            valor_total = EXCLUDED.valor_total;
                    `;
                    atualizados++;
                }
            } catch (e) {
                console.error(`⚠️ Tiny retornou erro de leitura para o CPF ${cpf}. Pulando para o próximo.`);
            }

            // O FREIO DE MÃO (Anti-Bloqueio): Espera 1 segundo entre as requisições
            await delay(1000); 
        }
        
        res.json({ sucesso: true, atualizados });
    } catch (erro) {
        console.error("Erro interno no servidor durante o cálculo:", erro);
        res.status(500).json({ sucesso: false, erro: 'Falha no servidor.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta: ${PORT}`));
module.exports = app;