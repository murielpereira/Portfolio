require('dotenv').config(); // Carrega as suas variáveis de ambiente do ficheiro .env
const { sql } = require('@vercel/postgres');

// Função auxiliar para não metralhar a API da Nuvemshop (respeitando os limites de requisição)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function corrigirDatasLogisticas() {
    console.log("=================================================");
    console.log("🚀 INICIANDO VARREDURA E CORREÇÃO DE DATAS LOGÍSTICAS");
    console.log("=================================================\n");

    try {
        // 1. Busca os últimos 600 pedidos que já saíram da loja
        console.log("Consultando o banco de dados...");
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio, status_nuvemshop
            FROM pedidos_nuvemshop
            WHERE status_nuvemshop IN ('Enviado', 'Entregue')
            ORDER BY data_criacao DESC
            LIMIT 600;
        `;

        console.log(`Encontrados ${pedidos.length} pedidos para analisar.\n`);

        let corrigidos = 0;
        let erros = 0;

        // 2. Loop de processamento
        for (let i = 0; i < pedidos.length; i++) {
            const p = pedidos[i];
            console.log(`[${i + 1}/${pedidos.length}] Analisando Pedido #${p.numero_pedido}...`);

            try {
                // A) Consulta a Nuvemshop
                const nsRes = await fetch(`https://api.nuvemshop.com.br/v1/${process.env.NUVEMSHOP_STORE_ID}/orders/${p.id_pedido}`, {
                    headers: {
                        'Authentication': `bearer ${process.env.NUVEMSHOP_TOKEN}`,
                        'User-Agent': 'Waltz-Script-Correcao'
                    }
                });

                if (!nsRes.ok) {
                    console.log(`   ⚠️ Erro ao buscar na Nuvemshop (Status: ${nsRes.status})`);
                    erros++;
                    await delay(600);
                    continue;
                }

                const dadosPedido = await nsRes.json();

                let dataEnvioFinal = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
                let dataEntregaFinal = null;
                let dataEnvioBackupSmart = null;

                // B) Consulta a SmartEnvios (Se houver rastreio)
                if (p.rastreio && process.env.SMARTENVIOS_TOKEN) {
                    const smRes = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "token": process.env.SMARTENVIOS_TOKEN
                        },
                        body: JSON.stringify({ "tracking_code": p.rastreio })
                    });

                    if (smRes.ok) {
                        const jsonSmart = await smRes.json();
                        if (jsonSmart.result && jsonSmart.result.trackings && jsonSmart.result.trackings.length > 0) {
                            const eventos = jsonSmart.result.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));

                            const eventoEntrega = eventos.find(e => e.code && e.code.tracking_type === 'DELIVERED');
                            if (eventoEntrega) {
                                dataEntregaFinal = new Date(eventoEntrega.date);
                            }

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
                }

                // C) O ESCUDO JS: Ativa se a Nuvemshop mandou uma data de envio MAIOR ou IGUAL à data de entrega
                if (!dataEnvioFinal || 
                    (dataEntregaFinal && dataEnvioFinal >= dataEntregaFinal) || 
                    (dataEntregaFinal && dataEnvioFinal.toISOString().substring(0,10) === dataEntregaFinal.toISOString().substring(0,10))
                ) {
                    if (dataEnvioBackupSmart) {
                        dataEnvioFinal = dataEnvioBackupSmart;
                        console.log(`   🛡️ Bug da Nuvemshop detectado! Usando data da SmartEnvios.`);
                    }
                }

                // Fallbacks Finais
                if (!dataEnvioFinal) {
                    dataEnvioFinal = new Date(dadosPedido.created_at);
                }
                if (p.status_nuvemshop === 'Entregue' && !dataEntregaFinal) {
                    dataEntregaFinal = dadosPedido.finished_at ? new Date(dadosPedido.finished_at) : new Date(dadosPedido.updated_at);
                }

                // D) Atualização no Banco de Dados
                const envioDB = dataEnvioFinal ? dataEnvioFinal.toISOString() : null;
                const entregaDB = dataEntregaFinal ? dataEntregaFinal.toISOString() : null;

                await sql`
                    UPDATE pedidos_nuvemshop
                    SET data_envio = ${envioDB}, data_entrega = ${entregaDB}
                    WHERE id_pedido = ${p.id_pedido};
                `;

                const d1Formatada = dataEnvioFinal ? dataEnvioFinal.toLocaleDateString('pt-BR') : 'N/A';
                const d2Formatada = dataEntregaFinal ? dataEntregaFinal.toLocaleDateString('pt-BR') : 'N/A';
                
                console.log(`   ✅ OK! Envio: ${d1Formatada} | Entrega: ${d2Formatada}`);
                corrigidos++;

            } catch (err) {
                console.error(`   ❌ FALHA crítica no pedido #${p.numero_pedido}:`, err.message);
                erros++;
            }

            // Pausa de 600ms para não exceder o limite de API da Nuvemshop/SmartEnvios
            await delay(600);
        }

        console.log("\n=================================================");
        console.log(`🎉 PROCESSO CONCLUÍDO!`);
        console.log(`Pedidos Corrigidos: ${corrigidos}`);
        console.log(`Erros: ${erros}`);
        console.log("=================================================");

    } catch (erroGeral) {
        console.error("Erro fatal ao iniciar o script:", erroGeral);
    }
}

corrigirDatasLogisticas(); 