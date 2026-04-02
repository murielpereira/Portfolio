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

// =========================================================
// ROTA DE CONFIGURAÇÕES (Limpa e Única)
// =========================================================
router.get('/api/configuracoes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        // Lendo os dados com o nome correto da tabela do seu DB
        const { rows } = await sql`SELECT * FROM configuracoes_sistema WHERE id = 1;`;
        
        // Se a tabela estiver vazia, devolvemos um objeto vazio para não quebrar o Front-end
        res.json({ sucesso: true, config: rows[0] || {} });
    } catch (erro) {
        console.error("Erro ao buscar configurações:", erro);
        res.status(500).json({ sucesso: false });
    }
});

router.post('/api/configuracoes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const c = req.body;
        
        // Salvando os dados com o nome correto da tabela do seu DB
        await sql`
            UPDATE configuracoes_sistema SET
                wpp_ativo = ${c.wpp_ativo},
                msg_aprovado = ${c.msg_aprovado},
                msg_fabricacao = ${c.msg_fabricacao},
                msg_rastreio = ${c.msg_rastreio},
                msg_rota = ${c.msg_rota},
                msg_feedback = ${c.msg_feedback},
                vip_diamante = ${c.vip_diamante},
                vip_ouro = ${c.vip_ouro},
                vip_prata = ${c.vip_prata}
            WHERE id = 1;
        `;
        res.json({ sucesso: true });
    } catch (erro) {
        console.error("Erro ao salvar config:", erro);
        res.status(500).json({ sucesso: false });
    }
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
        // Adiciona as novas colunas de Extravio à tabela existente dinamicamente
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

module.exports = router;