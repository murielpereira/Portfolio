// forcar_rastreios.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function forcarLeituraRastreios() {
    console.log("🚚 Iniciando a varredura (Nova Arquitetura - Fonte da Verdade: Nuvemshop)...");

    try {
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
            console.log(`\nConsultando pedido #${pedido.numero_pedido} (Rastreio: ${pedido.rastreio})...`);
            
            try {
                const respostaSmart = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    const resultado = jsonSmart.result;

                    if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                        const eventos = resultado.trackings.sort((a, b) => new Date(b.date) - new Date(a.date));
                        const statusAtual = eventos[0].code.tracking_type;
                        
                        // O NOSSO ESPIÃO: Mostra o status real que veio da transportadora!
                        console.log(`🕵️ Status atual na SmartEnvios: [${statusAtual}]`);

                        if (statusAtual === 'DELIVERED') {
                            
                            const respostaNuvem = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                                method: "PUT",
                                headers: { 
                                    'Authentication': `bearer ${TOKEN_NUVEM}`, 
                                    'Content-Type': 'application/json',
                                    'User-Agent': 'Waltz'
                                },
                                body: JSON.stringify({ shipping_status: "delivered" })
                            });

                            if (!respostaNuvem.ok) {
                                const erroTexto = await respostaNuvem.text();
                                console.error(`⚠️ Nuvemshop RECUSOU a atualização. Motivo:`, erroTexto);
                            } else {
                                console.log(`📡 Comando enviado para Nuvemshop (Pedido #${pedido.numero_pedido}).`);
                                entreguesHoje++;
                            }
                        }
                    } else {
                        console.log(`⚠️ Pacote não tem histórico de movimentação ainda.`);
                    }
                }
            } catch (erroLoop) {
                console.error(`❌ Falha ao verificar pedido #${pedido.numero_pedido}:`, erroLoop.message);
            }
            await delay(1000);
        }

        console.log(`\n🎉 VARREDURA CONCLUÍDA! ${entreguesHoje} solicitações de entrega enviadas à Nuvemshop.`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no Robô de Rastreamento:", erro.message);
        process.exit(1);
    }
}

forcarLeituraRastreios();