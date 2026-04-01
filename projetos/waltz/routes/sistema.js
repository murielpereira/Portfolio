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

router.get('/api/configuracoes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        // Busca a configuração (supondo que esteja na tabela configuracoes com id = 1)
        const { rows } = await sql`SELECT * FROM configuracoes WHERE id = 1;`;
        const config = rows[0] || {};
        res.json({ sucesso: true, config });
    } catch (erro) {
        console.error("Erro ao buscar configurações:", erro);
        res.status(500).json({ sucesso: false });
    }
});

router.post('/api/configuracoes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { templates_wpp, regras_vip } = req.body;
        if (templates_wpp) await sql`INSERT INTO configuracoes_sistema (chave, valor) VALUES ('templates_wpp', ${JSON.stringify(templates_wpp)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;`;
        if (regras_vip) await sql`INSERT INTO configuracoes_sistema (chave, valor) VALUES ('regras_vip', ${JSON.stringify(regras_vip)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;`;
        res.json({ sucesso: true });
    } catch (erro) { res.status(500).json({ sucesso: false }); }
});

router.get('/api/relatorios/logistica', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows } = await sql`
            SELECT 
                SUBSTRING(REGEXP_REPLACE(cep, '\\D', '', 'g'), 1, 2) AS prefixo_cep,
                COUNT(id_pedido) AS volume,
                ROUND(AVG(EXTRACT(EPOCH FROM (data_entrega::timestamp - data_envio::timestamp)) / 86400), 0) AS media_dias
            FROM pedidos_nuvemshop
            WHERE status_nuvemshop = 'Entregue' AND cep IS NOT NULL AND data_envio IS NOT NULL AND data_entrega IS NOT NULL AND data_entrega >= data_envio
            GROUP BY SUBSTRING(REGEXP_REPLACE(cep, '\\D', '', 'g'), 1, 2)
            ORDER BY volume DESC;
        `;
        res.json({ sucesso: true, dados: rows });
    } catch (erro) { res.status(500).json({ sucesso: false }); }
});

module.exports = router;