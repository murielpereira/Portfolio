require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <-- ADICIONE ESTA LINHA PARA WEBHOOKS

// CONFIGURAÇÃO DO COOKIE
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

// --- ROTAS DA NUVEMSHOP ---
app.get('/api/auth/nuvemshop', async (req, res) => {
    // 1. Pegamos apenas o código da URL
    const { code } = req.query;
    if (!code) return res.status(400).send('Erro ausente.');

    try {
        console.log(`\n⏳ 1. Pedindo Token para a Nuvemshop...`);
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
            console.log("✅ 2. Token recebido! Salvando no Cookie...");
            // 2. A CORREÇÃO MÁGICA ESTÁ AQUI: Pegamos o user_id direto dos dados!
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

// --- ROTAS DE LOGIN E LOGOUT ---
app.post('/api/login', (req, res) => {
    console.log(`\n👉 3. [ROTA LOGIN] Cookie recebido:`, req.session);
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

// --- ROTA DE BUSCAR PEDIDOS ---
app.get('/api/pedidos', async (req, res) => {
    console.log(`\n🔍 4. [ROTA PEDIDOS] Cookie final:`, req.session);
    
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });

    const STORE_ID = req.session.storeId;
    const ACCESS_TOKEN = req.session.nuvemshopToken;

    if (!STORE_ID || !ACCESS_TOKEN) {
        console.log("❌ ERRO: Faltou o Token ou o Store ID no Cookie!");
        return res.status(400).json({ erro: 'App não instalado.' });
    }

    try {
        console.log(`⏳ Buscando pedidos no servidor matriz (Tiendanube) para a loja ${STORE_ID}...`);
        
        // CORREÇÃO: Usamos a matriz api.tiendanube.com e garantimos o Content-Type
        const respostaNuvem = await fetch(`https://api.tiendanube.com/v1/${STORE_ID}/orders`, {
            method: 'GET',
            headers: {
                'Authentication': `bearer ${ACCESS_TOKEN}`,
                'User-Agent': USER_AGENT,
                'Content-Type': 'application/json'
            }
        });

        if (!respostaNuvem.ok) {
            const erroNuvem = await respostaNuvem.text();
            console.error(`❌ Erro da API: ${respostaNuvem.status} - ${erroNuvem}`);
            throw new Error(`Erro API: ${respostaNuvem.status}`);
        }
        
        const dadosPedidos = await respostaNuvem.json();
        console.log(`✅ Sucesso Absoluto! ${dadosPedidos.length} pedidos encontrados e enviados.`);
        res.json(dadosPedidos);
    } catch (erro) {
        console.error("❌ Erro ao buscar pedidos:", erro);
        res.status(500).json({ erro: 'Falha ao buscar pedidos.' });
    }
});

// ROTA DE WEBHOOK DO TINY (O Tiny vai bater aqui)
app.post('/api/webhook/tiny', async (req, res) => {
    try {
        const dadosRecebidos = req.body;
        
        // 1. Defesa contra o "Ping"
        if (!dadosRecebidos || Object.keys(dadosRecebidos).length === 0) {
            console.log("🔔 Ping de validação do Tiny recebido com sucesso!");
            return res.status(200).send('OK');
        }

        // 2. O RAIO-X: Imprime TUDO o que chegou
        console.log("\n📥 PACOTE CRU RECEBIDO DO TINY:");
        console.log(JSON.stringify(dadosRecebidos, null, 2));

        // Por enquanto, apenas confirmamos o recebimento
        res.status(200).send('OK');

    } catch (erro) {
        console.error("❌ Erro no Webhook do Tiny:", erro);
        res.status(200).send('OK'); 
    }
});

// FUNÇÃO QUE FAZ A MÁGICA NO TINY
async function processarGrupoClienteTiny(idPedido, cpf) {
    const TOKEN = process.env.TINY_TOKEN;

    // A. Busca quantos pedidos esse CPF tem no Tiny
    const buscaRes = await fetch(`https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpf}&formato=JSON`);
    const buscaDados = await buscaRes.json();
    
    // Contamos quantos pedidos retornaram
    const totalPedidos = buscaDados.retorno.pedidos ? buscaDados.retorno.pedidos.length : 0;
    
    // B. Define o Grupo
    let grupo = "Novato";
    if (totalPedidos > 5) grupo = "VIP";
    if (totalPedidos > 10) grupo = "Diamante";

    console.log(`📢 Cliente com ${totalPedidos} pedidos. Classificado como: ${grupo}`);

    // C. Atualiza a observação do pedido no Tiny
    const dadosAlteracao = {
        pedido: {
            id: idPedido,
            obs: `[GRUPO: ${grupo}]`
        }
    };

    const params = new URLSearchParams();
    params.append('token', TOKEN);
    params.append('formato', 'JSON');
    params.append('pedido', JSON.stringify(dadosAlteracao));

    await fetch('https://api.tiny.com.br/api2/pedido.alterar.php', {
        method: 'POST',
        body: params
    });

    console.log(`✅ Pedido ${idPedido} atualizado no Tiny com sucesso!`);
}

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`✅ Servidor Vercel-Ready rodando! http://localhost:${PORTA}`);
});
module.exports = app;