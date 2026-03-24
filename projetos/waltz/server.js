const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Permite o Node ler o formato JSON
app.use(express.json());

// Configuração do nosso "Crachá VIP" (Sessão)
app.use(session({
    secret: 'chave-super-secreta',
    resave: false,
    saveUninitialized: false
}));

// Serve os arquivos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------------
// CREDENCIAIS DO SEU APP NUVEMSHOP
// ------------------------------------------------------------------
const NUVEMSHOP_APP_ID = '22926';
const NUVEMSHOP_CLIENT_SECRET = '5ed0cfb282e4cde280a1fb6aaa171f01add96dfcd5b3f18c';
const USER_AGENT = 'Waltz (murielpereirabr@gmail.com)';

// ------------------------------------------------------------------
// ROTAS DA NUVEMSHOP
// ------------------------------------------------------------------

// 1. O "Aperto de Mão" (OAuth) da Nuvemshop
app.get('/api/auth/nuvemshop', async (req, res) => {
    const { code, store_id } = req.query;

    if (!code) return res.status(400).send('Erro: Código ausente.');

    try {
        console.log(`⏳ Trocando o código pelo Token da Nuvemshop...`);
        
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
            console.log("✅ SUCESSO! Token recebido:", dados.access_token);
            req.session.nuvemshopToken = dados.access_token;
            req.session.storeId = store_id;
            res.redirect('/');
        } else {
            console.error("❌ A Nuvemshop negou o Token:", dados);
            res.send(`Erro ao gerar token: ${JSON.stringify(dados)}`);
        }
    } catch (erro) {
        console.error("❌ Erro grave na Rota 1:", erro);
        res.send('Erro interno ao autenticar.');
    }
});

// 2. Buscar Pedidos da Nuvemshop
app.get('/api/pedidos', async (req, res) => {
    if (!req.session.logado) {
        return res.status(401).json({ erro: 'Acesso negado.' });
    }

    const STORE_ID = req.session.storeId;
    const ACCESS_TOKEN = req.session.nuvemshopToken;

    console.log(`🔍 Verificando os "Crachás": Loja ID [${STORE_ID}] | Token [${ACCESS_TOKEN ? 'Existe' : 'Faltando'}]`);

    if (!STORE_ID || !ACCESS_TOKEN) {
        console.log("❌ Tentou buscar pedidos, mas não tinha Token na sessão!");
        return res.status(400).json({ erro: 'App não instalado. Faça a integração primeiro.' });
    }

    try {
        console.log("⏳ Buscando pedidos lá na Nuvemshop...");
        const respostaNuvem = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders`, {
            method: 'GET',
            headers: {
                'Authentication': `bearer ${ACCESS_TOKEN}`,
                'User-Agent': USER_AGENT
            }
        });

        if (!respostaNuvem.ok) {
            const erroDetalhado = await respostaNuvem.text();
            console.error(`❌ A API de Pedidos da Nuvem retornou ERRO ${respostaNuvem.status}:`, erroDetalhado);
            throw new Error(`Erro API: ${respostaNuvem.status}`);
        }
        
        const dadosPedidos = await respostaNuvem.json();
        console.log(`✅ Sucesso! Encontramos ${dadosPedidos.length} pedidos.`);
        res.json(dadosPedidos);
    } catch (erro) {
        console.error("❌ Erro ao buscar pedidos:", erro);
        res.status(500).json({ erro: 'Falha ao buscar pedidos.' });
    }
});

// ------------------------------------------------------------------
// ROTAS DE LOGIN E LOGOUT
// ------------------------------------------------------------------

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
    req.session.destroy();
    res.json({ sucesso: true });
});

// ------------------------------------------------------------------
// LIGANDO O SERVIDOR
// ------------------------------------------------------------------
const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`✅ Servidor API rodando! http://localhost:${PORTA}`);
});

module.exports = app;