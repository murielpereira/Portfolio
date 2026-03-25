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

// --- ROTAS NUVEMSHOP ---
app.get('/api/auth/nuvemshop', async (req, res) => { /* Mantido */ });

// 🔐 NOVO LOGIN
app.post('/api/login', (req, res) => {
    if (req.body.usuario === 'ame' && req.body.senha === 'Ame@220520') {
        req.session.logado = true; res.json({ sucesso: true });
    } else { res.json({ sucesso: false }); }
});

app.get('/api/logout', (req, res) => { req.session = null; res.json({ sucesso: true }); });
app.get('/api/pedidos', async (req, res) => { /* Mantido */ });

// --- ROTA DE WEBHOOK TINY (Com lógica dos Selos) ---
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
        const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`;
        const respostaBusca = await fetch(urlBusca);
        const dadosBusca = await respostaBusca.json();

        let totalPedidos = 0;
        let valorTotalGasto = 0;

        if (dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
            totalPedidos = dadosBusca.retorno.pedidos.length;
            valorTotalGasto = dadosBusca.retorno.pedidos.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);
        }

        // A REGRA DOS SELOS SOLICITADA
        let grupo = "PRIMEIRA COMPRA";
        if (totalPedidos > 1) {
            if (valorTotalGasto <= 1000) grupo = "BRONZE";
            else if (valorTotalGasto <= 3000) grupo = "PRATA";
            else if (valorTotalGasto <= 6000) grupo = "OURO";
            else grupo = "DIAMANTE";
        }

        console.log(`📢 Cliente classificado como: [${grupo}] (R$ ${valorTotalGasto.toFixed(2)})`);
        // Aqui aguardamos a resposta do Tiny sobre o payload para injetar a observação
    } catch (erro) {
        console.error("❌ Falha na API do Tiny:", erro);
    }
}

// --- ROTAS DO BANCO DE DADOS (RELATÓRIOS) ---
app.get('/api/relatorios/clientes', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows } = await sql`SELECT * FROM clientes ORDER BY nome ASC`;
        res.json({ sucesso: true, clientes: rows });
    } catch (erro) {
        res.status(500).json({ sucesso: false });
    }
});

// A SINCRONIZAÇÃO EM LOTES (Evita o Timeout de 5 minutos da Vercel)
app.post('/api/relatorios/sincronizar-contatos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const TOKEN = process.env.TINY_TOKEN;
    const paginaAtual = req.body.pagina || 1; 
    const paginasPorLote = 15; 

    try {
        let pagina = paginaAtual;
        let salvosNesteLote = 0;
        let totalPaginasTiny = 1;
        let terminou = false;

        while (pagina < paginaAtual + paginasPorLote) {
            const urlBusca = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resposta = await fetch(urlBusca);
            const dados = await resposta.json();

            if (dados.retorno.status === 'OK' && dados.retorno.contatos) {
                totalPaginasTiny = dados.retorno.numero_paginas;
                
                for (const item of dados.retorno.contatos) {
                    const c = item.contato;
                    const cpfLimpo = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : null;
                    if (cpfLimpo) {
                        await sql`
                            INSERT INTO clientes (cpf, nome, cidade, estado)
                            VALUES (${cpfLimpo}, ${c.nome}, ${c.cidade || '-'}, ${c.uf || '-'})
                            ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome;
                        `;
                        salvosNesteLote++;
                    }
                }
                if (pagina >= totalPaginasTiny) { terminou = true; break; }
                pagina++;
            } else { terminou = true; break; }
        }
        res.json({ sucesso: true, proximaPagina: pagina, concluiu: terminou, salvosNesteLote });
    } catch (erro) { res.status(500).json({ sucesso: false, erro: 'Falha no lote.' }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta: ${PORT}`));
module.exports = app;