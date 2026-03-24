require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const https = require('https'); // O MÓDULO RAIZ PARA BURLAR A REDE DA VERCEL

const app = express();

// =======================================================
// TRADUTORES DE DADOS
// =======================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================================================
// CONFIGURAÇÃO DO COOKIE
// =======================================================
app.use(cookieSession({
    name: 'sessao-automacao',
    keys: [process.env.CHAVE_SECRETA_SESSAO],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, 
    sameSite: 'lax' 
}));

// Servir os arquivos do Front-end
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
        console.log(`\n⏳ Pedindo Token para a Nuvemshop...`);
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
            console.log("✅ Token recebido! Salvando no Cookie...");
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

    if (!STORE_ID || !ACCESS_TOKEN) {
        return res.status(400).json({ erro: 'App não instalado.' });
    }

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
        
        const dadosPedidos = await respostaNuvem.json();
        res.json(dadosPedidos);
    } catch (erro) {
        console.error("❌ Erro ao buscar pedidos na Nuvemshop:", erro);
        res.status(500).json({ erro: 'Falha ao buscar pedidos.' });
    }
});

// =======================================================
// ROTAS DO TINY ERP
// =======================================================

app.post('/api/webhook/tiny', async (req, res) => {
    try {
        const payload = req.body;
        
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(200).send('OK');
        }

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

        // A estrutura exata da sua imagem de documentação
        const pacoteJson = {
            dados_pedido: {
                obs: `Grupo: ${grupo}`
            }
        };

        const postData = new URLSearchParams();
        postData.append('token', TOKEN);
        postData.append('formato', 'JSON');
        postData.append('id', idPedido);
        postData.append('pedido', JSON.stringify(pacoteJson));
        
        const bodyString = postData.toString();

        console.log(`⏳ Escrevendo grupo nas observações do pedido ${idPedido}...`);
        
        // REQUISIÇÃO NATIVA: Sem Vercel Edge Fetch, forçando o Content-Length exato
        const resultadoAlteracao = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'api.tiny.com.br',
                path: '/api2/pedido.alterar.php',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(bodyString)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch(e) {
                        resolve({ retorno: { status: 'Erro', erros: [{erro: 'Falha fatal na leitura'}] } });
                    }
                });
            });

            req.on('error', reject);
            req.write(bodyString);
            req.end();
        });

        if (resultadoAlteracao.retorno.status === 'OK') {
            console.log(`✅ SUCESSO ABSOLUTO! Observação salva no pedido ${idPedido}!`);
        } else {
            console.error(`❌ O Tiny recusou a alteração:`, JSON.stringify(resultadoAlteracao.retorno.erros));
        }

    } catch (erro) {
        console.error("❌ Falha na comunicação com a API do Tiny:", erro);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Vercel-Ready rodando! Porta: ${PORT}`);
});

module.exports = app;