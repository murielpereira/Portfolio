require('dotenv').config();
const { sql } = require('@vercel/postgres');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function rodarScript() {
    console.log("\n⏳ Iniciando correção das datas dos pedidos Entregues...\n");
    try {
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL AND rastreio != '' AND status_nuvemshop = 'Entregue'
            ORDER BY data_criacao DESC;
        `;

        if (pedidos.length === 0) {
            console.log("✅ Nenhum pedido para corrigir.");
            process.exit(0);
        }

        const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
        let corrigidos = 0;

        for (const pedido of pedidos) {
            try {
                const resposta = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (resposta.ok) {
                    const json = await resposta.json();
                    const resultado = json.result;

                    if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                        const eventos = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const ultimoEvento = eventos[eventos.length - 1];
                        
                        if (ultimoEvento.code.tracking_type === 'DELIVERED') {
                            const dataColetaReal = new Date(eventos[0].date);
                            const dataEntregaReal = new Date(ultimoEvento.date);

                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET data_envio = ${dataColetaReal}, data_entrega = ${dataEntregaReal}
                                WHERE id_pedido = ${pedido.id_pedido};
                            `;
                            corrigidos++;
                            console.log(`✅ Pedido #${pedido.numero_pedido}: Envio ${dataColetaReal.toLocaleDateString()} -> Entrega ${dataEntregaReal.toLocaleDateString()}`);
                        }
                    }
                }
            } catch (e) {
                console.log(`❌ Erro no pedido #${pedido.numero_pedido}`);
            }
            await delay(500); // Respeita a API
        }
        console.log(`\n🚀 Concluído! ${corrigidos} pedidos tiveram as datas ajustadas.`);
        process.exit(0);
    } catch (erro) {
        console.error("Erro fatal:", erro.message);
        process.exit(1);
    }
}

rodarScript();