// forcar_rastreios.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;

// Função para criar uma pausa e evitar bloqueios das APIs
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function forcarLeituraRastreios() {
    console.log("🚚 Iniciando a varredura forçada de rastreios...");

    try {
        // Busca no banco APENAS pedidos em aberto que tenham código de rastreio
        const { rows: pedidosPendentes } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL 
              AND rastreio != '' 
              AND status_nuvemshop = 'Aberto';
        `;

        console.log(`🔎 Encontrados ${pedidosPendentes.length} pedidos em trânsito para verificar.`);

        let entreguesHoje = 0;

        for (const pedido of pedidosPendentes) {
            console.log(`Consultando pacote do pedido #${pedido.numero_pedido} (Rastreio: ${pedido.rastreio})...`);
            
            try {
                const respostaSmart = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json", 
                        "Accept": "application/json", 
                        "token": TOKEN_SMART 
                    },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    const resultado = jsonSmart.result;

                    if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                        const eventos = resultado.trackings.sort((a, b) => new Date(b.date) - new Date(a.date));
                        const statusAtual = eventos[0].code.tracking_type;

                        if (statusAtual === 'DELIVERED') {
                            
                            // A. Avisa a Nuvemshop para colocar o selo de "Entregue" (shipping_status: "delivered")
                            await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                                method: "PUT",
                                headers: { 
                                    'Authentication': `bearer ${TOKEN_NUVEM}`, 
                                    'Content-Type': 'application/json',
                                    'User-Agent': 'Waltz'
                                },
                                // MUDANÇA PRINCIPAL AQUI:
                                body: JSON.stringify({ shipping_status: "delivered" })
                            });

                            // B. Atualiza o nosso banco de dados local
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET status_nuvemshop = 'Entregue'
                                WHERE id_pedido = ${pedido.id_pedido};
                            `;
                            
                            console.log(`✅ OBA! Pedido #${pedido.numero_pedido} foi entregue! O selo verde foi aplicado na Nuvemshop.`);
                            entreguesHoje++;
                        }
                    }
                } else {
                    console.log(`⚠️ SmartEnvios não encontrou o rastreio do pedido #${pedido.numero_pedido}.`);
                }
            } catch (erroLoop) {
                console.error(`❌ Falha ao verificar pedido #${pedido.numero_pedido}:`, erroLoop.message);
            }
            
            await delay(1000);
        }

        console.log(`\n🎉 VARREDURA CONCLUÍDA! ${entreguesHoje} pedidos foram atualizados para Entregue.`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no Robô de Rastreamento:", erro.message);
        process.exit(1);
    }
}

forcarLeituraRastreios();