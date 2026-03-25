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
// ROTAS DE LOGIN E LOGOUT (Com Segurança Máxima)
// ==========================================
app.post('/api/login', (req, res) => {
    // 1. Puxamos as credenciais seguras do arquivo .env ou da Vercel
    const USUARIO_SECRETO = process.env.PAINEL_USUARIO;
    const SENHA_SECRETA = process.env.PAINEL_SENHA;

    // Trava de segurança: avisa no console se esquecermos de configurar as variáveis
    if (!USUARIO_SECRETO || !SENHA_SECRETA) {
        console.error("❌ Faltam as variáveis de ambiente PAINEL_USUARIO ou PAINEL_SENHA.");
        return res.status(500).json({ sucesso: false, erro: 'Configuração de segurança ausente.' });
    }

    // 2. Comparamos o que o usuário digitou com as nossas variáveis secretas
    if (req.body.usuario === USUARIO_SECRETO && req.body.senha === SENHA_SECRETA) {
        req.session.logado = true; 
        res.json({ sucesso: true });
    } else { 
        res.json({ sucesso: false }); 
    }
});

// ==========================================
// ROTA: PEDIDOS NUVEMSHOP (Lendo do Banco de Dados Interno)
// ==========================================
app.get('/api/pedidos', async (req, res) => {
    // 1. Verifica se o usuário está logado por segurança
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });

    try {
        // 2. Busca todos os pedidos no nosso banco de dados, ordenando dos mais novos para os mais antigos
        const { rows: pedidos } = await sql`
            SELECT * FROM pedidos_nuvemshop 
            ORDER BY data_criacao DESC;
        `;
        
        // 3. Devolve os pedidos prontos para o Front-end
        res.json(pedidos);
    } catch (erro) {
        console.error("❌ Erro ao buscar pedidos no banco de dados:", erro);
        res.status(500).json({ erro: 'Erro interno ao carregar pedidos salvos.' });
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

// ==========================================
// WEBHOOK: NUVEMSHOP (Criação e Atualização de Pedidos Automática)
// ==========================================
app.post('/api/webhook/nuvemshop', async (req, res) => {
    // A Nuvemshop exige que retornemos 200 OK rapidamente
    res.status(200).send('Recebido');

    const evento = req.headers['x-linked-store-event']; // Ex: order/created ou order/updated
    const dadosPedido = req.body;

    if (!dadosPedido || !dadosPedido.id) return;

    console.log(`\n📦 NUVEMSHOP WEBHOOK: Evento ${evento} para o pedido #${dadosPedido.number}`);

    try {
        const id_pedido = dadosPedido.id.toString();
        const numero_pedido = dadosPedido.number.toString();
        const data_criacao = new Date(dadosPedido.created_at);
        const data_envio = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
        
        const cliente = dadosPedido.customer ? dadosPedido.customer.name : 'Desconhecido';
        const cpf = dadosPedido.customer ? dadosPedido.customer.identification.replace(/\D/g, '') : '';
        const cidade = dadosPedido.shipping_address ? dadosPedido.shipping_address.city : '';
        const estado = dadosPedido.shipping_address ? dadosPedido.shipping_address.province : '';
        
        // Limpa o nome da transportadora removendo "via SmartEnvios"
        let transportadora = dadosPedido.shipping_option || '';
        transportadora = transportadora.replace(/via SmartEnvios/gi, '').trim();
        
        const rastreio = dadosPedido.shipping_tracking_number || '';
        
        // Status simplificado da Nuvemshop
        let status = 'Aberto';
        if (dadosPedido.status === 'closed') status = 'Arquivado';
        if (dadosPedido.status === 'canceled') status = 'Cancelado';

        // UPSERT: Salva ou atualiza o pedido no nosso banco
        await sql`
            INSERT INTO pedidos_nuvemshop (
                id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, 
                cidade, estado, transportadora, rastreio, status_nuvemshop, data_envio
            )
            VALUES (
                ${id_pedido}, ${numero_pedido}, ${data_criacao}, ${cliente}, ${cpf}, 
                ${cidade}, ${estado}, ${transportadora}, ${rastreio}, ${status}, ${data_envio}
            )
            ON CONFLICT (id_pedido) DO UPDATE SET 
                transportadora = EXCLUDED.transportadora,
                rastreio = EXCLUDED.rastreio,
                status_nuvemshop = EXCLUDED.status_nuvemshop,
                data_envio = EXCLUDED.data_envio;
        `;
        console.log(`✅ Pedido #${numero_pedido} salvo/atualizado com sucesso!`);
    } catch (erro) {
        console.error(`❌ Erro ao processar webhook da Nuvemshop:`, erro);
    }
});

// ==========================================
// ROBÔ DE RASTREAMENTO: SMARTENVIOS (Agendado via Vercel Cron)
// ==========================================
app.get('/api/cron/verificar-entregas', async (req, res) => {
    console.log("🤖 Iniciando verificação automática de rastreios...");
    
    try {
        // 1. Busca no banco de dados pedidos criados há mais de 15 dias 
        // que têm código de rastreio e ainda não constam como "Entregue"
        const { rows: pedidosPendentes } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL 
              AND rastreio != '' 
              AND status_nuvemshop != 'Entregue'
              AND data_criacao <= NOW() - INTERVAL '15 days';
        `;

        console.log(`🔎 Encontrados ${pedidosPendentes.length} pedidos antigos para verificar.`);

        let atualizados = 0;
        const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
        const URL_API = "https://api.smartenvios.com/v1/freight-order/tracking";

        // 2. Loop de verificação: Bate na API da SmartEnvios para cada pedido
        for (const pedido of pedidosPendentes) {
            try {
                const resposta = await fetch(URL_API, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json", 
                        "Accept": "application/json", 
                        "token": TOKEN_SMART 
                    },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (resposta.ok) {
                    const json = await resposta.json();
                    const r = json.result;

                    // Verifica se existe histórico e se o evento mais recente é 'DELIVERED'
                    if (r && r.trackings && r.trackings.length > 0) {
                        // Ordena para garantir que o índice [0] é o mais atual
                        const eventos = r.trackings.sort((a, b) => new Date(b.date) - new Date(a.date));
                        const statusAtual = eventos[0].code.tracking_type;

                        if (statusAtual === 'DELIVERED') {
                            // Se foi entregue, atualiza o nosso Banco de Dados
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET status_nuvemshop = 'Entregue'
                                WHERE id_pedido = ${pedido.id_pedido};
                            `;
                            console.log(`✅ Pedido #${pedido.numero_pedido} marcado como ENTREGUE!`);
                            atualizados++;
                        }
                    }
                }
            } catch (erroLoop) {
                console.error(`⚠️ Falha ao verificar rastreio do pedido #${pedido.numero_pedido}:`, erroLoop.message);
            }
            
            // Pausa de 500ms para não bombardear o servidor da SmartEnvios (Rate Limit)
            await new Promise(res => setTimeout(res, 500));
        }

        res.json({ sucesso: true, mensagem: `Verificação concluída. ${atualizados} pedidos atualizados para Entregue.` });

    } catch (erro) {
        console.error("❌ Erro fatal no Robô de Rastreamento:", erro);
        res.status(500).json({ sucesso: false, erro: "Falha na verificação." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta: ${PORT}`));
module.exports = app;