// resgatar_datas_entrega.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;

// Pausa de segurança para não congestionar a internet
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function resgatarDatasAntigas() {
    console.log("⏳ Iniciando o resgate de datas de entrega históricas...");

    try {
        // 1. Busca apenas pedidos enviados que não têm data de entrega preenchida
        const { rows: pedidosSemData } = await sql`
            SELECT id_pedido, numero_pedido 
            FROM pedidos_nuvemshop
            WHERE (status_nuvemshop = 'Entregue' OR status_nuvemshop = 'Arquivado')
              AND data_entrega IS NULL
              AND data_envio IS NOT NULL;
        `;

        console.log(`🔎 Encontrados ${pedidosSemData.length} pedidos para investigar na Nuvemshop.`);

        let atualizados = 0;

        // 2. Passa por cada pedido histórico
        for (const pedido of pedidosSemData) {
            try {
                const resposta = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                    headers: { 'Authentication': `bearer ${ACCESS_TOKEN}`, 'User-Agent': 'Waltz' }
                });

                if (resposta.ok) {
                    const dadosNuvem = await resposta.json();

                    // A Nuvemshop marca o final do pedido no 'finished_at' ou 'updated_at'
                    const dataParaSalvar = dadosNuvem.finished_at || dadosNuvem.updated_at;

                    if (dataParaSalvar) {
                        // 3. Atualiza o banco de dados
                        await sql`
                            UPDATE pedidos_nuvemshop 
                            SET data_entrega = ${dataParaSalvar}
                            WHERE id_pedido = ${pedido.id_pedido};
                        `;
                        atualizados++;
                        console.log(`✅ Pedido #${pedido.numero_pedido} resgatado! Data de entrega: ${new Date(dataParaSalvar).toLocaleDateString('pt-BR')}`);
                    }
                }
            } catch (erroLoop) {
                console.error(`⚠️ Falha ao consultar pedido #${pedido.numero_pedido}:`, erroLoop.message);
            }
            
            await delay(500); // Respeita a velocidade da API da Nuvemshop
        }

        console.log(`\n🎉 RESGATE CONCLUÍDO! ${atualizados} pedidos tiveram suas datas de entrega preenchidas.`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no script de resgate:", erro.message);
        process.exit(1);
    }
}

resgatarDatasAntigas();