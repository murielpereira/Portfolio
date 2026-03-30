require('dotenv').config();
const { sql } = require('@vercel/postgres');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function forcarArquivamento() {
    console.log("\n🕵️ Buscando todos os pedidos Abertos ou Enviados no nosso banco...\n");

    try {
        // Puxa TODOS os pedidos que ainda não constam como entregues no nosso sistema
        const { rows: pedidosPendentes } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL AND rastreio != '' 
            AND status_nuvemshop IN ('Aberto', 'Enviado', 'Entregue');
        `;

        console.log(`📦 Encontrados ${pedidosPendentes.length} pedidos para varrer. Verificando SmartEnvios...`);
        console.log("--------------------------------------------------");

        const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
        const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
        const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
        let atualizados = 0;

        for (const pedido of pedidosPendentes) {
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
                        const eventosOrdenados = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const ultimoEvento = eventosOrdenados[eventosOrdenados.length - 1];
                        
                        if (ultimoEvento.code.tracking_type === 'DELIVERED') {
                            const dataColetaReal = new Date(eventosOrdenados[0].date);
                            const dataEntregaReal = new Date(ultimoEvento.date);

                            // Força a Nuvemshop a arquivar ('closed')
                            const respostaNuvem = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                                method: "PUT",
                                headers: { 'Authentication': `bearer ${TOKEN_NUVEM}`, 'Content-Type': 'application/json', 'User-Agent': 'Waltz' },
                                body: JSON.stringify({ status: "closed" })
                            });

                            // Atualiza o nosso BD para Entregue
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET status_nuvemshop = 'Entregue', 
                                    data_envio = ${dataColetaReal}, 
                                    data_entrega = ${dataEntregaReal}
                                WHERE id_pedido = ${pedido.id_pedido};
                            `;
                            
                            atualizados++;
                            console.log(`✅ Sucesso: Pedido #${pedido.numero_pedido} fechado na Nuvemshop e marcado como Entregue no App.`);
                        } else {
                            console.log(`🚚 Pedido #${pedido.numero_pedido} ainda em trânsito.`);
                        }
                    }
                }
            } catch (e) {
                console.log(`❌ Erro ao verificar pedido #${pedido.numero_pedido}`);
            }
            await delay(500); // Pausa de segurança
        }

        console.log(`\n🚀 Finalizado! ${atualizados} pedidos foram forçados para Arquivado/Entregue.`);
        process.exit(0);

    } catch (erro) {
        console.error("Erro fatal no script:", erro.message);
        process.exit(1);
    }
}

forcarArquivamento();