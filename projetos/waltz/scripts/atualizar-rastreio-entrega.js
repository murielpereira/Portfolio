// ============================================================================
// SCRIPT: AUDITORIA LOGÍSTICA (SMARTENVIOS) E HIGIENIZAÇÃO DE DATAS
// Objetivo: Consultar as datas reais, aplicar regras de negócio sanitárias 
// e anular dados absurdos (>60 dias ou Same-Day fora de SC).
// ============================================================================

require('dotenv').config();
const { sql } = require('@vercel/postgres');

const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
const URL_API = "https://api.smartenvios.com/v1/freight-order/tracking";

// Função para pausar e não ser bloqueado pela SmartEnvios
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sincronizarDatasReais() {
    console.log("🛠️ Iniciando a Máquina do Tempo: Sincronizando e higienizando datas...");

    try {
        // 1. Puxamos os pedidos com rastreio, incluindo o CEP para a regra de validação
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio, cep
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL AND rastreio != '';
        `;

        console.log(`🔎 Encontrados ${pedidos.length} pedidos para auditar. Iniciando varredura...\n`);

        let atualizadosComSucesso = 0;
        let anuladosPorErro = 0;

        // 2. Passa por cada pedido
        for (const pedido of pedidos) {
            try {
                let dataColetaReal = null;
                let dataEntregaReal = null;

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
                        const eventosOrdenados = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const statusFinal = eventosOrdenados[eventosOrdenados.length - 1].code.tracking_type;

                        // Se tiver sido entregue, capta as datas
                        if (statusFinal === 'DELIVERED') {
                            dataColetaReal = new Date(eventosOrdenados[0].date);
                            dataEntregaReal = new Date(eventosOrdenados[eventosOrdenados.length - 1].date);
                        }
                    }
                }

                // ==============================================================
                // 3. FILTROS DE SANIDADE (Validação de Regras de Negócio)
                // ==============================================================
                if (dataColetaReal && dataEntregaReal) {
                    // Calcula a diferença em dias isolando os fusos horários
                    const d1 = new Date(dataColetaReal);
                    const d2 = new Date(dataEntregaReal);
                    const data1UTC = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
                    const data2UTC = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
                    const diffDias = Math.floor((data2UTC - data1UTC) / (1000 * 60 * 60 * 24));

                    // Limpa o CEP para ter a certeza que comparamos só os números (remove hífen)
                    const cepLimpo = (pedido.cep || '').replace(/\D/g, '');

                    // Regra A: Mais de 60 dias é considerado erro de integração
                    if (diffDias > 60) {
                        dataEntregaReal = null;
                    }
                    // Regra B: Entrega no mesmo dia (0 dias) só é válida para o CEP local
                    else if (diffDias === 0 && cepLimpo !== '88240000') {
                        dataEntregaReal = null;
                    }
                    // Regra C: Anomalia temporal (Data de entrega antes da data de envio)
                    else if (diffDias < 0) {
                        dataEntregaReal = null;
                    }
                }

                // ==============================================================
                // 4. ATUALIZAÇÃO NO BANCO DE DADOS
                // ==============================================================
                // O código Vercel Postgres aceita variáveis "null" e traduz para NULL no banco automaticamente
                await sql`
                    UPDATE pedidos_nuvemshop 
                    SET data_envio = ${dataColetaReal}, 
                        data_entrega = ${dataEntregaReal}
                    WHERE id_pedido = ${pedido.id_pedido};
                `;

                // Log visual no terminal para acompanharmos a limpeza
                if (dataEntregaReal === null) {
                    anuladosPorErro++;
                    console.log(`🧹 Pedido #${pedido.numero_pedido}: Data de entrega apagada (Inválida, >60 dias ou Falso Same-Day).`);
                } else {
                    atualizadosComSucesso++;
                    console.log(`✅ Pedido #${pedido.numero_pedido} corrigido! Coleta: ${dataColetaReal.toLocaleDateString()} | Entrega: ${dataEntregaReal.toLocaleDateString()}`);
                }

            } catch (erroLoop) {
                console.error(`⚠️ Falha ao ler o pedido #${pedido.numero_pedido}: ${erroLoop.message}`);
            }
            
            // Pausa de 1 segundo entre cada consulta para respeitar o limite do servidor da transportadora
            await delay(1000); 
        }

        console.log(`\n🎉 SINCRONIZAÇÃO E HIGIENIZAÇÃO CONCLUÍDAS!`);
        console.log(`✨ ${atualizadosComSucesso} pedidos tiveram suas datas validadas e corrigidas.`);
        console.log(`🧹 ${anuladosPorErro} pedidos tiveram suas datas de entrega apagadas devido a regras de negócio ou rastreio inválido.`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no script:", erro.message);
        process.exit(1);
    }
}

sincronizarDatasReais();