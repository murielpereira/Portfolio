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

app.use(express.static(path.join(__dirname, 'public')));

const NUVEMSHOP_APP_ID = process.env.NUVEMSHOP_APP_ID;
const NUVEMSHOP_CLIENT_SECRET = process.env.NUVEMSHOP_CLIENT_SECRET;
const USER_AGENT = 'Waltz (murielpereirabr@gmail.com)';

// =======================================================
// ROTAS DA NUVEMSHOP
// =======================================================
app.get('/api/auth/nuvemshop', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('Erro ausente.');

    try {
        console.log(`\n⏳ Pedindo Token Nuvemshop...`);
        const resposta = await fetch('https://www.nuvemshop.com.br/apps/authorize/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: NUVEMSHOP_APP_ID,
                client_secret: NUVEMSHOP_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code
            })
        });

        const dados = await resposta.json();
        if (dados.access_token) {
            req.session.nuvemshopToken = dados.access_token;
            req.session.storeId = dados.user_id; 
            res.redirect('/');
        } else {
            res.send(`Erro: ${JSON.stringify(dados)}`);
        }
    } catch (erro) {
        console.error(erro);
        res.send('Erro interno.');
    }
});

app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '123456') {
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

app.get('/api/pedidos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const STORE_ID = req.session.storeId;
    const ACCESS_TOKEN = req.session.nuvemshopToken;

    if (!STORE_ID || !ACCESS_TOKEN) return res.status(400).json({ erro: 'App não instalado.' });

    try {
        const cabecalhosNuvem = new Headers();
        cabecalhosNuvem.append('Authentication', `bearer ${ACCESS_TOKEN}`);
        cabecalhosNuvem.append('User-Agent', USER_AGENT);
        cabecalhosNuvem.append('Content-Type', 'application/json');

        const respostaNuvem = await fetch(`https://api.tiendanube.com/v1/${STORE_ID}/orders`, {
            method: 'GET',
            headers: cabecalhosNuvem
        });

        if (!respostaNuvem.ok) throw new Error(`Erro API: ${respostaNuvem.status}`);
        res.json(await respostaNuvem.json());
    } catch (erro) {
        console.error("❌ Erro Nuvemshop:", erro);
        res.status(500).json({ erro: 'Falha ao buscar pedidos.' });
    }
});

// =======================================================
// ROTAS DO TINY ERP (Webhook e Automação)
// =======================================================
app.post('/api/webhook/tiny', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) return res.status(200).send('OK');

        const dados = payload.dados;
        if (dados && dados.id && dados.cliente && dados.cliente.cpfCnpj) {
            const idPedidoTiny = dados.id;
            const cpfCliente = dados.cliente.cpfCnpj;
            console.log(`\n📦 NOVO PEDIDO RECEBIDO! ID: ${idPedidoTiny} | CPF: ${cpfCliente}`);
            
            await processarGrupoClienteTiny(idPedidoTiny, cpfCliente);
        }
        res.status(200).send('OK');
    } catch (erro) {
        console.error("❌ Erro no Webhook do Tiny:", erro);
        res.status(200).send('OK'); 
    }
});

// A INTELIGÊNCIA COM A NOVA ESTRUTURA (Graças à sua documentação)
async function processarGrupoClienteTiny(idPedido, cpfBruto) {
    const TOKEN = process.env.TINY_TOKEN;
    const cpfLimpo = cpfBruto.replace(/\D/g, '');

    try {
        console.log(`⏳ Buscando histórico de compras para o CPF ${cpfLimpo}...`);
        const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`;
        const respostaBusca = await fetch(urlBusca);
        const dadosBusca = await respostaBusca.json();

        let totalPedidos = 0;
        if (dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
            totalPedidos = dadosBusca.retorno.pedidos.length;
        }

        let grupo = "Novato";
        if (totalPedidos >= 2 && totalPedidos <= 4) grupo = "Cliente Prata";
        if (totalPedidos >= 5 && totalPedidos <= 9) grupo = "Cliente Ouro";
        if (totalPedidos >= 10) grupo = "Cliente VIP";

        console.log(`📢 Identificado: ${totalPedidos} compra(s). Classificado como: [${grupo}]`);

        // ====================================================================
        // A ESTRUTURA CORRETA (Sem wrapper, direto no alvo)
        // ====================================================================
        const pacoteJson = {
            obs: `Grupo: ${grupo}`
        };

        const params = new URLSearchParams();
        params.append('token', TOKEN);
        params.append('formato', 'JSON');
        params.append('id', idPedido);
        
        // O NOME DO PARÂMETRO É 'dados_pedido' E NÃO 'pedido'!
        params.append('dados_pedido', JSON.stringify(pacoteJson));

        console.log(`⏳ Escrevendo grupo no pedido ${idPedido}...`);
        const urlAlteracao = 'https://api.tiny.com.br/api2/pedido.alterar.php';
        
        const respostaAlteracao = await fetch(urlAlteracao, {
            method: 'POST',
            body: params 
        });

        const resultadoAlteracao = await respostaAlteracao.json();

        if (resultadoAlteracao.retorno.status === 'OK') {
            console.log(`✅ SUCESSO ABSOLUTO! Observação salva no pedido ${idPedido}!`);
        } else {
            console.error(`❌ O Tiny recusou a alteração:`, JSON.stringify(resultadoAlteracao.retorno.erros));
        }

    } catch (erro) {
        console.error("❌ Falha na comunicação com a API do Tiny:", erro);
    }
}

// =======================================================
// ROTAS DE RELATÓRIOS (Painel Interno e Banco de Dados)
// =======================================================

// 1. Ler os dados do nosso próprio Banco Vercel Postgres (Ultra rápido)
app.get('/api/relatorios/clientes', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });

    try {
        // Busca todos os clientes ordenados pelo valor gasto
        const { rows } = await sql`SELECT * FROM clientes ORDER BY valor_total DESC, total_pedidos DESC`;
        res.json({ sucesso: true, clientes: rows });
    } catch (erro) {
        console.error("❌ Erro ao ler o banco de dados:", erro);
        res.status(500).json({ sucesso: false, erro: 'Falha ao ler o banco de dados.' });
    }
});

// 2. Botão de Sincronização Manual: Puxa do Tiny e salva no nosso Banco
app.post('/api/relatorios/sincronizar-contatos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const TOKEN = process.env.TINY_TOKEN;

    try {
        console.log("⏳ Buscando contatos no Tiny para sincronizar com o banco...");
        // Buscando a primeira página de contatos (pode ser expandido depois)
        const urlBusca = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON`;
        const resposta = await fetch(urlBusca);
        const dados = await resposta.json();

        if (dados.retorno.status === 'OK' && dados.retorno.contatos) {
            let salvos = 0;

            for (const item of dados.retorno.contatos) {
                const c = item.contato;
                const cpfLimpo = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : null;
                
                // Só salvamos se o cliente tiver um CPF/CNPJ válido
                if (cpfLimpo) {
                    const cidade = c.cidade || '-';
                    const uf = c.uf || '-';
                    
                    // UPSERT: Se o CPF não existir, insere. Se já existir, apenas atualiza o nome e cidade.
                    await sql`
                        INSERT INTO clientes (cpf, nome, cidade, estado)
                        VALUES (${cpfLimpo}, ${c.nome}, ${cidade}, ${uf})
                        ON CONFLICT (cpf) DO UPDATE SET
                            nome = EXCLUDED.nome,
                            cidade = EXCLUDED.cidade,
                            estado = EXCLUDED.estado;
                    `;
                    salvos++;
                }
            }
            res.json({ sucesso: true, mensagem: `${salvos} contatos sincronizados no banco de dados!` });
        } else {
            res.json({ sucesso: false, erro: 'Nenhum contato retornado do Tiny.' });
        }
    } catch (erro) {
        console.error("❌ Erro na sincronização:", erro);
        res.status(500).json({ sucesso: false, erro: 'Falha interna na sincronização.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta: ${PORT}`));
module.exports = app;