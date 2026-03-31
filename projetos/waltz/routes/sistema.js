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

router.post('/api/configuracoes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { templates_wpp, regras_vip, whatsapp_ativo } = req.body;
        
        if (templates_wpp) await sql`INSERT INTO configuracoes_sistema (chave, valor) VALUES ('templates_wpp', ${JSON.stringify(templates_wpp)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;`;
        if (regras_vip) await sql`INSERT INTO configuracoes_sistema (chave, valor) VALUES ('regras_vip', ${JSON.stringify(regras_vip)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;`;
        
        if (whatsapp_ativo !== undefined) {
            await sql`INSERT INTO configuracoes_sistema (chave, valor) VALUES ('whatsapp_ativo', ${String(whatsapp_ativo)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;`;
        }
        
        res.json({ sucesso: true });
    } catch (erro) { res.status(500).json({ sucesso: false }); }
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

module.exports = router;