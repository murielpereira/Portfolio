// importar_nuvem_completo.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function importarTudoNuvem() {
    console.log("⏳ Iniciando varredura profunda de pedidos na Nuvemshop...");
    let pagina = 1;
    let temMais = true;
    let salvos = 0;

    try {
        while (temMais) {
            console.log(`📄 Lendo página ${pagina}...`);
            const resposta = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders?per_page=50&page=${pagina}`, {
                headers: { 'Authentication': `bearer ${ACCESS_TOKEN}`, 'User-Agent': 'Waltz' }
            });

            if (!resposta.ok) throw new Error(`Erro na API: ${resposta.status}`);
            const pedidos = await resposta.json();

            if (pedidos.length === 0) { temMais = false; break; }

            for (const p of pedidos) {
                const id_pedido = p.id.toString();
                const numero_pedido = p.number.toString();
                const data_criacao = new Date(p.created_at);
                const data_envio = p.shipped_at ? new Date(p.shipped_at) : null;

                const cliente = p.customer ? p.customer.name : 'Desconhecido';
                const cpf = p.customer && p.customer.identification ? p.customer.identification.replace(/\D/g, '') : '';
                const telefone = p.customer && p.customer.phone ? p.customer.phone : '';
                const cidade = p.shipping_address ? p.shipping_address.city : '';
                const estado = p.shipping_address ? p.shipping_address.province : '';

                let transportadora = p.shipping_option || '';
                transportadora = transportadora.replace(/via SmartEnvios/gi, '').trim();
                const rastreio = p.shipping_tracking_number || '';

                let status = 'Aberto';
                const statusPrincipal = (p.status || '').toLowerCase();
                const statusPagamento = (p.payment_status || '').toLowerCase();

                if (statusPrincipal === 'closed') status = 'Arquivado';
                if (
                    statusPrincipal === 'canceled' || statusPrincipal === 'cancelled' ||
                    statusPagamento === 'canceled' || statusPagamento === 'voided' || statusPagamento === 'abandoned'
                ) { status = 'Cancelado'; }

                let listaProdutos = '';
                if (p.products && Array.isArray(p.products)) {
                    listaProdutos = p.products.map(item => `${item.quantity}x ${item.name}`).join(', ');
                }

                await sql`
                    INSERT INTO pedidos_nuvemshop (
                        id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone,
                        cidade, estado, transportadora, rastreio, status_nuvemshop, data_envio, produtos
                    )
                    VALUES (
                        ${id_pedido}, ${numero_pedido}, ${data_criacao}, ${cliente}, ${cpf}, ${telefone},
                        ${cidade}, ${estado}, ${transportadora}, ${rastreio}, ${status}, ${data_envio}, ${listaProdutos}
                    )
                    ON CONFLICT (id_pedido) DO UPDATE SET
                        nome_cliente = EXCLUDED.nome_cliente, cpf_cliente = EXCLUDED.cpf_cliente,
                        telefone = EXCLUDED.telefone, cidade = EXCLUDED.cidade,
                        estado = EXCLUDED.estado, transportadora = EXCLUDED.transportadora,
                        rastreio = EXCLUDED.rastreio, status_nuvemshop = EXCLUDED.status_nuvemshop,
                        data_envio = EXCLUDED.data_envio, produtos = EXCLUDED.produtos;
                `;
                salvos++;
            }
            pagina++;
            await delay(1000); // Respeita o limite da Nuvemshop
        }

        console.log(`✅ SUCESSO! ${salvos} pedidos foram verificados/importados.`);
        
        // Remove fisicamente os cancelados para manter o banco leve e rápido
        const resultDelete = await sql`DELETE FROM pedidos_nuvemshop WHERE status_nuvemshop = 'Cancelado';`;
        console.log(`🧹 LIMPEZA FINAL: ${resultDelete.rowCount} pedidos cancelados foram excluídos do banco de dados.`);
        
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro na varredura:", erro.message);
        process.exit(1);
    }
}
importarTudoNuvem();