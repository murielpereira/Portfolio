const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');
const { delay } = require('../utils/helpers');

// Função para avisar a Nuvemshop para arquivar o pedido
async function atualizarStatusNuvemshop(idPedido, statusEnvio, statusPedido) {
    const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
    const TOKEN = process.env.NUVEMSHOP_TOKEN;
    const url = `https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${idPedido}`;

    try {
        await fetch(url, {
            method: 'PUT',
            headers: { 'Authentication': `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'Waltz' },
            body: JSON.stringify({
                shipping_status: statusEnvio, 
                status: statusPedido         
            })
        });
        console.log(`✅ Nuvemshop Atualizada: Pedido #${idPedido} status: ${statusPedido}`);
    } catch (e) {
        console.error(`❌ Erro ao avisar Nuvemshop do pedido ${idPedido}:`, e.message);
    }
}

// O Robô Principal
async function processarRastreiosLogistica(limite = 20) {
    let atualizados = 0;
    try {
        // A BUSCA QUE FALTAVA! Agora ele vai ao banco buscar quem tem rastreio mas não tem entrega.
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop 
            WHERE rastreio IS NOT NULL 
              AND rastreio != ''
              AND data_entrega IS NULL 
            LIMIT ${limite};
        `;

        if (pedidos.length === 0) return { sucesso: true, mensagem: "Nenhum pedido pendente.", log: [] };

        for (const pedido of pedidos) {
            try {
                const respostaSmart = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                    method: "POST", 
                    headers: { "Content-Type": "application/json", "token": process.env.SMARTENVIOS_TOKEN },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (respostaSmart.ok) {
                    const { result } = await respostaSmart.json();
                    
                    if (result && result.trackings && result.trackings.length > 0) {
                        const evt = result.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const statusTransportadora = evt[evt.length - 1].code.tracking_type;
                        const dataPostagemReal = new Date(evt[0].date);

                        if (statusTransportadora === 'DELIVERED') {
                            const dataEntregaReal = new Date(evt[evt.length - 1].date);
                            
                            // Atualiza o nosso banco
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET status_nuvemshop = 'Entregue', 
                                    data_envio = ${dataPostagemReal}, 
                                    data_entrega = ${dataEntregaReal} 
                                WHERE id_pedido = ${pedido.id_pedido};
                            `;
                            
                            // Avisa a Nuvemshop
                            await atualizarStatusNuvemshop(pedido.id_pedido, 'delivered', 'closed');
                            atualizados++;
                        } else {
                            // Corrige a data de envio se a Nuvemshop tiver preenchido errado
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET data_envio = ${dataPostagemReal} 
                                WHERE id_pedido = ${pedido.id_pedido} AND data_envio != ${dataPostagemReal};
                            `;
                        }
                    }
                }
            } catch (e) {
                console.error(`Erro ao processar rastreio do pedido ${pedido.numero_pedido}:`, e);
            }
            await delay(500); 
        }
        return { sucesso: true, mensagem: `Resumo: ${atualizados} pedidos atualizados com sucesso.`, log: [] };
    } catch (erro) { 
        console.error("Erro geral no Motor de Logística:", erro);
        return { sucesso: false }; 
    }
}

// Rotas do Módulo
router.get('/api/script/atualizar-rastreios', async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write("Iniciando verificação de rastreios...\n");
    const resultado = await processarRastreiosLogistica(50);
    res.end(`\n${resultado.mensagem}`);
});

router.get('/api/cron/verificar-entregas', async (req, res) => {
    const resultado = await processarRastreiosLogistica(15); 
    if (resultado.sucesso) res.status(200).json(resultado);
    else res.status(500).json(resultado);
});

module.exports = router;