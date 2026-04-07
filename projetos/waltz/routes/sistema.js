const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');

router.get('/api/check-session', (req, res) => {
    if (req.session && req.session.logado) res.json({ logado: true });
    else res.json({ logado: false });
});

router.post('/api/login', (req, res) => {
    if (req.body.usuario === process.env.PAINEL_USUARIO && req.body.senha === process.env.PAINEL_SENHA) {
        req.session.logado = true; res.json({ sucesso: true });
    } else { res.json({ sucesso: false }); }
});

router.get('/api/logout', (req, res) => { 
    req.session = null; res.json({ sucesso: true }); 
});

// Substitua tudo entre a rota /api/logout e a rota /api/trocas por isto:

// =========================================================
// ROTA DE CONFIGURAÇÕES (Blindada 2.0 - Sem depender do ID)
// =========================================================
router.get('/api/configuracoes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS configuracoes_sistema (
                wpp_ativo BOOLEAN DEFAULT false,
                msg_aprovado TEXT, msg_fabricacao TEXT, msg_rastreio TEXT, msg_rota TEXT, msg_feedback TEXT,
                vip_diamante NUMERIC DEFAULT 6000, vip_ouro NUMERIC DEFAULT 3000, vip_prata NUMERIC DEFAULT 1000
            );
        `;
        // Adiciona as colunas de "Ativo/Inativo" individuais dinamicamente
        try {
            await sql`ALTER TABLE configuracoes_sistema ADD COLUMN IF NOT EXISTS ativo_aprovado BOOLEAN DEFAULT true;`;
            await sql`ALTER TABLE configuracoes_sistema ADD COLUMN IF NOT EXISTS ativo_fabricacao BOOLEAN DEFAULT true;`;
            await sql`ALTER TABLE configuracoes_sistema ADD COLUMN IF NOT EXISTS ativo_rastreio BOOLEAN DEFAULT true;`;
            await sql`ALTER TABLE configuracoes_sistema ADD COLUMN IF NOT EXISTS ativo_rota BOOLEAN DEFAULT true;`;
            await sql`ALTER TABLE configuracoes_sistema ADD COLUMN IF NOT EXISTS ativo_feedback BOOLEAN DEFAULT true;`;
        } catch(e) {}
        
        let { rows } = await sql`SELECT * FROM configuracoes_sistema LIMIT 1;`;
        if (rows.length === 0) {
            await sql`INSERT INTO configuracoes_sistema (wpp_ativo) VALUES (false);`;
            const res2 = await sql`SELECT * FROM configuracoes_sistema LIMIT 1;`;
            rows = res2.rows;
        }
        
        // Traduz a linha plana do banco para o Objeto aninhado que o Front-end adora ler
        const row = rows[0] || {};
        const configFormatada = {
            whatsapp_ativo: row.wpp_ativo,
            templates_wpp: {
                aprovado: row.msg_aprovado, ativo_aprovado: row.ativo_aprovado !== false,
                fabricacao: row.msg_fabricacao, ativo_fabricacao: row.ativo_fabricacao !== false,
                rastreio: row.msg_rastreio, ativo_rastreio: row.ativo_rastreio !== false,
                rota: row.msg_rota, ativo_rota: row.ativo_rota !== false,
                feedback: row.msg_feedback, ativo_feedback: row.ativo_feedback !== false
            },
            regras_vip: { diamante: row.vip_diamante, ouro: row.vip_ouro, prata: row.vip_prata }
        };
        
        res.json({ sucesso: true, config: configFormatada });
    } catch (erro) {
        console.error("Erro ao buscar configurações:", erro);
        res.status(500).json({ sucesso: false });
    }
});

router.post('/api/configuracoes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const c = req.body;
        await sql`
            UPDATE configuracoes_sistema SET
                wpp_ativo = ${c.whatsapp_ativo},
                msg_aprovado = ${c.templates_wpp.aprovado}, ativo_aprovado = ${c.templates_wpp.ativo_aprovado},
                msg_fabricacao = ${c.templates_wpp.fabricacao}, ativo_fabricacao = ${c.templates_wpp.ativo_fabricacao},
                msg_rastreio = ${c.templates_wpp.rastreio}, ativo_rastreio = ${c.templates_wpp.ativo_rastreio},
                msg_rota = ${c.templates_wpp.rota}, ativo_rota = ${c.templates_wpp.ativo_rota},
                msg_feedback = ${c.templates_wpp.feedback}, ativo_feedback = ${c.templates_wpp.ativo_feedback},
                vip_diamante = ${c.regras_vip.diamante}, vip_ouro = ${c.regras_vip.ouro}, vip_prata = ${c.regras_vip.prata}
        `;
        res.json({ sucesso: true });
    } catch (erro) { res.status(500).json({ sucesso: false }); }
});

// =========================================================
// ROTAS DE TROCAS E DEVOLUÇÕES (Logística Reversa)
// =========================================================
router.get('/api/trocas', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS trocas_devolucoes (
                id SERIAL PRIMARY KEY,
                data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                numero_pedido VARCHAR(50),
                nome_cliente VARCHAR(150),
                estado VARCHAR(50),
                qtd_pecas INT,
                modelo VARCHAR(150),
                valor_pecas NUMERIC,
                valor_frete NUMERIC,
                frete_pago_por VARCHAR(50),
                motivo VARCHAR(255),
                canal VARCHAR(50)
            );
        `;
        try {
            await sql`ALTER TABLE trocas_devolucoes ADD COLUMN IF NOT EXISTS tipo_ocorrencia VARCHAR(50) DEFAULT 'Troca/Devolução';`;
            await sql`ALTER TABLE trocas_devolucoes ADD COLUMN IF NOT EXISTS ressarcido VARCHAR(20) DEFAULT 'Nao';`;
            await sql`ALTER TABLE trocas_devolucoes ADD COLUMN IF NOT EXISTS valor_ressarcido NUMERIC DEFAULT 0;`;
        } catch(e) {}

        const { rows } = await sql`SELECT * FROM trocas_devolucoes ORDER BY data_registro DESC;`;
        res.json({ sucesso: true, dados: rows });
    } catch (erro) {
        res.status(500).json({ sucesso: false });
    }
});

router.post('/api/trocas', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const d = req.body;
        await sql`
            INSERT INTO trocas_devolucoes (
                numero_pedido, nome_cliente, estado, qtd_pecas, modelo, 
                valor_pecas, valor_frete, frete_pago_por, motivo, canal,
                tipo_ocorrencia, ressarcido, valor_ressarcido
            ) VALUES (
                ${d.numero_pedido}, ${d.nome_cliente}, ${d.estado}, ${d.qtd_pecas}, ${d.modelo},
                ${d.valor_pecas}, ${d.valor_frete}, ${d.frete_pago_por}, ${d.motivo}, ${d.canal},
                ${d.tipo_ocorrencia}, ${d.ressarcido}, ${d.valor_ressarcido}
            );
        `;
        res.json({ sucesso: true });
    } catch (erro) {
        res.status(500).json({ sucesso: false });
    }
});

// =========================================================
// ROTA DE TESTE DO WHATSAPP (Fila de Mensagens)
// =========================================================
router.post('/api/whatsapp/testar', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        // Cria a tabela da Fila se ela não existir
        await sql`
            CREATE TABLE IF NOT EXISTS fila_mensagens (
                id SERIAL PRIMARY KEY,
                telefone VARCHAR(20),
                mensagem TEXT,
                status VARCHAR(20) DEFAULT 'Pendente',
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        // Insere o teste na fila
        await sql`
            INSERT INTO fila_mensagens (telefone, mensagem, status)
            VALUES ('5548991574943', ${req.body.mensagem}, 'Pendente');
        `;
        res.json({ sucesso: true });
    } catch (erro) {
        console.error("Erro na fila do wpp:", erro);
        res.status(500).json({ sucesso: false });
    }
});

module.exports = router;