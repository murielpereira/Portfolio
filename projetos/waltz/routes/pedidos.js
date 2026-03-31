const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');
const { fetchComRetry } = require('../utils/helpers');

const pedidosEmProcessamentoNuvem = new Set();

router.get('/api/pedidos', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows: pedidos } = await sql`SELECT * FROM pedidos_nuvemshop WHERE status_nuvemshop != 'Cancelado' ORDER BY data_criacao DESC;`;
        res.json(pedidos);
    } catch (erro) { res.status(500).json({ erro: 'Erro interno' }); }
});

router.post('/api/pedidos/marcar-feedback', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { id_pedido } = req.body;
        await sql`UPDATE pedidos_nuvemshop SET status_feedback = 'Enviado' WHERE id_pedido = ${id_pedido};`;
        res.json({ sucesso: true });
    } catch (erro) { res.status(500).json({ sucesso: false }); }
});

router.post('/api/webhook/nuvemshop', async (req, res) => {
    const payload = req.body;
    if (!payload || !payload.id) return res.status(200).send('Ignorado'); 

    const idPedidoNuvem = payload.id.toString();
    if (pedidosEmProcessamentoNuvem.has(idPedidoNuvem)) return res.status(200).send('Eco ignorado'); 

    pedidosEmProcessamentoNuvem.add(idPedidoNuvem);
    setTimeout(() => { pedidosEmProcessamentoNuvem.delete(idPedidoNuvem); }, 10000); 

    try {
        const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
        const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;
        const resposta = await fetchComRetry(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${idPedidoNuvem}`, { headers: { 'Authentication': `bearer ${ACCESS_TOKEN}`, 'User-Agent': 'Waltz' } });
        const dadosPedido = await resposta.json();

        const cliente = dadosPedido.customer ? dadosPedido.customer.name : 'Desconhecido';
        const cpf = dadosPedido.customer && dadosPedido.customer.identification ? dadosPedido.customer.identification.replace(/\D/g, '') : '';
        const email_cliente = dadosPedido.customer && dadosPedido.customer.email ? dadosPedido.customer.email : '';
        const telefone = dadosPedido.customer && dadosPedido.customer.phone ? dadosPedido.customer.phone : '';
        
        let status = 'Aberto';
        const statusPrincipal = (dadosPedido.status || '').toLowerCase();
        const statusEnvio = (dadosPedido.shipping_status || '').toLowerCase();

        if (statusPrincipal === 'closed' || statusEnvio === 'delivered') status = 'Entregue';
        else if (statusEnvio === 'shipped') status = 'Enviado'; 
        if (statusPrincipal === 'canceled') status = 'Cancelado';

        let data_entrega = null;
        const rastreio = dadosPedido.shipping_tracking_number || '';
        if (status === 'Entregue' && (!rastreio || rastreio === '')) data_entrega = new Date();

        await sql`
            INSERT INTO pedidos_nuvemshop (
                id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone, email_cliente,
                status_nuvemshop, rastreio, cep, data_envio, data_entrega
            )
            VALUES (
                ${dadosPedido.id}, ${dadosPedido.number}, ${new Date(dadosPedido.created_at)}, ${cliente}, ${cpf}, ${telefone}, ${email_cliente},
                ${status}, ${rastreio}, ${dadosPedido.shipping_address ? dadosPedido.shipping_address.zipcode : ''},
                ${dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null}, ${data_entrega}
            )
            ON CONFLICT (id_pedido) DO UPDATE SET 
                status_nuvemshop = EXCLUDED.status_nuvemshop,
                rastreio = EXCLUDED.rastreio,
                data_envio = EXCLUDED.data_envio,
                data_entrega = CASE WHEN EXCLUDED.status_nuvemshop = 'Entregue' AND pedidos_nuvemshop.data_entrega IS NULL THEN EXCLUDED.data_entrega ELSE pedidos_nuvemshop.data_entrega END;
        `;
        res.status(200).send('Processado e salvo com sucesso');
    } catch (erro) { res.status(200).send('Falha interna'); }
});

module.exports = router;