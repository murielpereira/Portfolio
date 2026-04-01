const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');
const { fetchComRetry } = require('../utils/helpers');

const pedidosEmProcessamentoNuvem = new Set();

// ============================================================================
// ROTAS DE CONSULTA E PAINEL
// ============================================================================
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

// ============================================================================
// O WEBHOOK INTELIGENTE (À PROVA DE BUGS DA NUVEMSHOP)
// ============================================================================
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

        const rastreio = dadosPedido.shipping_tracking_number || '';
        
        // ==============================================================
        // LÓGICA DE CRUZAMENTO DE DATAS (O Cérebro da Automação)
        // ==============================================================
        let dataEnvioFinal = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
        let dataEntregaFinal = null;
        let dataEnvioBackupSmart = null;

        if (rastreio && process.env.SMARTENVIOS_TOKEN) {
            try {
                const respostaSmart = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": process.env.SMARTENVIOS_TOKEN },
                    body: JSON.stringify({ "tracking_code": rastreio })
                });

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    if (jsonSmart.result && jsonSmart.result.trackings && jsonSmart.result.trackings.length > 0) {
                        const eventos = jsonSmart.result.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const ultimoEvento = eventos[eventos.length - 1];

                        // Captura a data de entrega
                        if (ultimoEvento.code && ultimoEvento.code.tracking_type === 'DELIVERED') {
                            dataEntregaFinal = new Date(ultimoEvento.date);
                        }

                        // Procura o primeiro bipe físico como backup (Ignorando criações de etiqueta)
                        const bipeFisico = eventos.find(e => 
                            e.code &&
                            e.code.tracking_type !== 'CREATED' && 
                            e.code.tracking_type !== 'REGISTERED' &&
                            !(e.message && e.message.toLowerCase().includes("criado"))
                        );

                        if (bipeFisico) {
                            dataEnvioBackupSmart = new Date(bipeFisico.date);
                        }
                    }
                }
            } catch (err) { 
                console.error("⚠️ Falha ao buscar dados na SmartEnvios via Webhook"); 
            }
        }

        // 🛡️ O ESCUDO: Se a Nuvemshop sobrescrever o envio com a entrega (ou enviar vazio), usamos a SmartEnvios
        if (!dataEnvioFinal || (dataEntregaFinal && dataEnvioFinal.toISOString().substring(0,10) === dataEntregaFinal.toISOString().substring(0,10))) {
            if (dataEnvioBackupSmart) {
                dataEnvioFinal = dataEnvioBackupSmart;
            }
        }

        // Fallbacks Finais de Segurança
        if (!dataEnvioFinal && (status === 'Enviado' || status === 'Entregue')) {
            dataEnvioFinal = new Date(dadosPedido.created_at);
        }
        if (status === 'Entregue' && !dataEntregaFinal) {
            dataEntregaFinal = dadosPedido.finished_at ? new Date(dadosPedido.finished_at) : new Date(dadosPedido.updated_at);
        }

        // ==============================================================
        // GRAVAÇÃO NO BANCO DE DADOS
        // ==============================================================
        const envioDB = dataEnvioFinal ? dataEnvioFinal.toISOString() : null;
        const entregaDB = dataEntregaFinal ? dataEntregaFinal.toISOString() : null;

        await sql`
            INSERT INTO pedidos_nuvemshop (
                id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone, email_cliente,
                status_nuvemshop, rastreio, cep, data_envio, data_entrega
            )
            VALUES (
                ${dadosPedido.id}, ${dadosPedido.number}, ${new Date(dadosPedido.created_at).toISOString()}, ${cliente}, ${cpf}, ${telefone}, ${email_cliente},
                ${status}, ${rastreio}, ${dadosPedido.shipping_address ? dadosPedido.shipping_address.zipcode : ''},
                ${envioDB}, ${entregaDB}
            )
            ON CONFLICT (id_pedido) DO UPDATE SET 
                status_nuvemshop = EXCLUDED.status_nuvemshop,
                rastreio = EXCLUDED.rastreio,
                data_envio = CASE WHEN EXCLUDED.data_envio IS NOT NULL THEN EXCLUDED.data_envio ELSE pedidos_nuvemshop.data_envio END,
                data_entrega = CASE WHEN EXCLUDED.data_entrega IS NOT NULL THEN EXCLUDED.data_entrega ELSE pedidos_nuvemshop.data_entrega END;
        `;
        res.status(200).send('Processado e salvo com sucesso');
    } catch (erro) { res.status(200).send('Falha interna'); }
});

module.exports = router;