// sincronizar_datas_reais.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
const URL_API = "https://api.smartenvios.com/v1/freight-order/tracking";

// Função para pausar e não ser bloqueado pela SmartEnvios
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sincronizarDatasReais() {
    console.log("🛠️ Iniciando a Máquina do Tempo: Sincronizando datas reais de Coleta e Entrega...");

    try {
        // 1. Puxa todos os pedidos que já foram entregues ou arquivados e têm rastreio
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL AND rastreio != ''
            AND (status_nuvemshop = 'Entregue' OR status_nuvemshop = 'Arquivado');
        `;

        console.log(`🔎 Encontrados ${pedidos.length} pedidos para auditar. Iniciando varredura...\n`);

        let atualizados = 0;

        // 2. Passa por cada pedido
        for (const pedido of pedidos) {
            try {
                // Pergunta o histórico do pacote à SmartEnvios
                const respostaSmart = await fetch(URL_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    const resultado = jsonSmart.result;

                    if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                        
                        // Ordena os eventos do mais antigo para o mais novo (ordem cronológica)
                        const eventosOrdenados = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        
                        // O Primeiro Evento é a Coleta Física (Data de Envio Real)
                        const dataColetaReal = new Date(eventosOrdenados[0].date);
                        
                        // O Último Evento é a Entrega Final (Data de Entrega Real)
                        const dataEntregaReal = new Date(eventosOrdenados[eventosOrdenados.length - 1].date);
                        const statusFinal = eventosOrdenados[eventosOrdenados.length - 1].code.tracking_type;

                        // Só atualizamos se o pacote realmente constar como entregue na transportadora
                        if (statusFinal === 'DELIVERED') {
                            
                            // 3. Atualiza o banco de dados sobrescrevendo as datas da Nuvemshop pelas datas da Transportadora
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET data_envio = ${dataColetaReal}, 
                                    data_entrega = ${dataEntregaReal}
                                WHERE id_pedido = ${pedido.id_pedido};
                            `;
                            
                            atualizados++;
                            console.log(`✅ Pedido #${pedido.numero_pedido} corrigido! Coleta: ${dataColetaReal.toLocaleDateString()} | Entrega: ${dataEntregaReal.toLocaleDateString()}`);
                        }
                    }
                }
            } catch (erroLoop) {
                console.error(`⚠️ Falha ao ler o pedido #${pedido.numero_pedido}: ${erroLoop.message}`);
            }
            
            // Pausa de 1 segundo entre cada consulta para respeitar o limite do servidor da transportadora
            await delay(1000); 
        }

        console.log(`\n🎉 SINCRONIZAÇÃO CONCLUÍDA! ${atualizados} pedidos tiveram suas datas corrigidas para a realidade física.`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no script:", erro.message);
        process.exit(1);
    }
}

sincronizarDatasReais();