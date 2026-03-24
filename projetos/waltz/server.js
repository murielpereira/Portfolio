require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const app = express();

// TRADUTORES DE DADOS (Cruciais para Webhooks e APIs)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CONFIGURAÇÃO DO COOKIE (Para o seu painel de relatórios)
app.use(cookieSession({
    name: 'sessao-automacao',
    keys: [process.env.CHAVE_SECRETA_SESSAO],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, // Em produção na Vercel, o ideal é true se usar HTTPS, mas false funciona bem
    sameSite: 'lax' 
}));

// Servir os arquivos do Front-end (painel)
app.use(express.static(path.join(__dirname, 'public')));

// VARIÁVEIS NUVEMSHOP
const NUVEMSHOP_APP_ID = process.env.NUVEMSHOP_APP_ID;
const NUVEMSHOP_CLIENT_SECRET = process.env.NUVEMSHOP_CLIENT_SECRET;
const USER_AGENT = 'Waltz (murielpereirabr@gmail.com)';

// =======================================================
// ROTAS DA NUVEMSHOP (Autenticação e Busca de Pedidos)
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
// ROTA DE WEBHOOK DO TINY (O Gatilho da Automação)
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
            
            // CORREÇÃO CRUCIAL: Adicionamos o 'await' para a Vercel não desligar o servidor!
            await processarGrupoClienteTiny(idPedidoTiny, cpfCliente);
        }

        // Só responde 'OK' depois que TODO o trabalho terminou
        res.status(200).send('OK');

    } catch (erro) {
        console.error("❌ Erro no Webhook do Tiny:", erro);
        res.status(200).send('OK'); 
    }
});

async function processarGrupoClienteTiny(idPedido, cpfBruto) {
    const TOKEN = process.env.TINY_TOKEN;

    // Limpamos o CPF (tira pontos e traço) para a busca na API não dar erro
    const cpfLimpo = cpfBruto.replace(/\D/g, '');

    try {
        // PASSO 1: Perguntar ao Tiny quantos pedidos esse CPF tem
        console.log(`⏳ Buscando histórico de compras para o CPF ${cpfLimpo}...`);
        const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`;
        
        const respostaBusca = await fetch(urlBusca);
        const dadosBusca = await respostaBusca.json();

        let totalPedidos = 0;
        if (dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
            totalPedidos = dadosBusca.retorno.pedidos.length;
        }

        // PASSO 2: A Matemática dos Grupos
        let grupo = "Primeira Compra";
        if (totalPedidos >= 2 && totalPedidos <= 4) grupo = "Cliente Prata";
        if (totalPedidos >= 5 && totalPedidos <= 9) grupo = "Cliente Ouro";
        if (totalPedidos >= 10) grupo = "Cliente VIP";

        console.log(`📢 Identificado: ${totalPedidos} compra(s). Classificado como: [${grupo}]`);

        // PASSO 3: Injetar a observação no pedido do Tiny
        // A PEGADINHA DO TINY: No alterar.php, o pacote se chama "dados_pedido"
        const dadosAlteracao = {
            dados_pedido: {
                obs: `[GRUPO DO CLIENTE: ${grupo}] \n---`
            }
        };

        const params = new URLSearchParams();
        params.append('token', TOKEN);
        params.append('formato', 'JSON');
        params.append('id', idPedido); // No alterar.php, o ID do pedido vai fora do pacote!
        params.append('dados_pedido', JSON.stringify(dadosAlteracao)); 

        console.log(`⏳ Escrevendo grupo nas observações do pedido ${idPedido}...`);
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
// INICIALIZAÇÃO DO SERVIDOR
// =======================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Vercel-Ready rodando! Porta: ${PORT}`);
});

module.exports = app;