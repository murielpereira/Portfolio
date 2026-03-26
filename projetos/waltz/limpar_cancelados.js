// limpar_cancelados.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function limparPedidosCancelados() {
    console.log("🧹 Iniciando faxina: Procurando pedidos cancelados ou com pagamento vencido...");

    try {
        // Puxa os últimos 200 pedidos da Nuvemshop
        const resposta = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders?per_page=200`, {
            headers: { 'Authentication': `bearer ${ACCESS_TOKEN}`, 'User-Agent': 'Waltz' }
        });
        const pedidos = await resposta.json();
        let corrigidos = 0;

        for (const p of pedidos) {
            const id_pedido = p.id.toString();
            
            let status = 'Aberto';
            const statusPrincipal = (p.status || '').toLowerCase();
            const statusPagamento = (p.payment_status || '').toLowerCase();

            if (statusPrincipal === 'closed') status = 'Arquivado';
            
            // A mesma regra inteligente que colocamos no Webhook
            if (
                statusPrincipal === 'canceled' || 
                statusPrincipal === 'cancelled' ||
                statusPagamento === 'canceled' || 
                statusPagamento === 'voided' || 
                statusPagamento === 'abandoned'
            ) {
                status = 'Cancelado';
            }

            // Atualiza apenas o status no banco de dados
            await sql`
                UPDATE pedidos_nuvemshop 
                SET status_nuvemshop = ${status}
                WHERE id_pedido = ${id_pedido};
            `;

            if (status === 'Cancelado') {
                corrigidos++;
            }
        }
        
        console.log(`✅ FAXINA CONCLUÍDA! ${corrigidos} pedidos foram identificados e corrigidos para "Cancelado".`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro durante a faxina:", erro.message);
        process.exit(1);
    }
}

limparPedidosCancelados();