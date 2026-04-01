// ============================================================================
// SCRIPT: AUDITORIA LOGÍSTICA (A VERDADE ABSOLUTA)
// Regra: Limpa a lousa. Envio = Nuvemshop | Entrega = SmartEnvios.
// Alvo: Últimos 500 pedidos entregues.
// ============================================================================

require('dotenv').config();
const { sql } = require('@vercel/postgres');

const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
const URL_API_SMART = "https://api.smartenvios.com/v1/freight-order/tracking";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sincronizarDatasReais() {
    console.log("🛠️ Limpando o Banco de Dados e buscando a Verdade na Nuvemshop e SmartEnvios...");

    try {
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio, cep, data_criacao
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL 
              AND rastreio != ''
              AND status_nuvemshop = 'Entregue'
            ORDER BY data_criacao DESC
            LIMIT 500;
        `;

        console.log(`🔎 Encontrados ${pedidos.length} pedidos. Iniciando varredura...\n`);

        let atualizadosComSucesso = 0;
        let anuladosPorErro = 0;

        for (const pedido of pedidos) {
            try {
                let dataEnvioFinal = null;
                let dataEntregaFinal = null;
                let rastreioFinalizado = false;

                // ==============================================================
                // 1. NUVEMSHOP: A FONTE PRIMÁRIA DO ENVIO
                // ==============================================================
                const urlNuvem = `https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`;
                const respostaNuvem = await fetch(urlNuvem, { headers: { 'Authentication': `bearer ${TOKEN_NUVEM}`, 'User-Agent': 'Waltz' } });
                
                if (respostaNuvem.ok) {
                    const jsonNuvem = await respostaNuvem.json();
                    if (jsonNuvem.shipped_at) {
                        dataEnvioFinal = new Date(jsonNuvem.shipped_at);
                    }
                }

                // ==============================================================
                // 2. SMARTENVIOS: A FONTE DA ENTREGA (E BACKUP DO ENVIO)
                // ==============================================================
                const respostaSmart = await fetch(URL_API_SMART, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                let dataEnvioBackupSmart = null;

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    if (jsonSmart.result && jsonSmart.result.trackings && jsonSmart.result.trackings.length > 0) {
                        const eventos = jsonSmart.result.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const ultimoEvento = eventos[eventos.length - 1];
                        
                        if (ultimoEvento.code && ultimoEvento.code.tracking_type === 'DELIVERED') {
                            dataEntregaFinal = new Date(ultimoEvento.date);
                            rastreioFinalizado = true;
                            
                            // Pega o primeiro bipe físico real com a verificação de segurança (e.message)
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

                // ==============================================================
                // 3. CRUZAMENTO DE DADOS (A INTELIGÊNCIA)
                // ==============================================================
                // Se a Nuvemshop não nos deu a data de envio, ou se ela deu a mesma data da entrega (erro de sobreposição da API)
                if (!dataEnvioFinal || (dataEntregaFinal && dataEnvioFinal.toISOString().substring(0,10) === dataEntregaFinal.toISOString().substring(0,10))) {
                    if (dataEnvioBackupSmart) {
                        dataEnvioFinal = dataEnvioBackupSmart;
                    } else {
                        dataEnvioFinal = new Date(pedido.data_criacao); // Último recurso absoluto
                    }
                }

                // ==============================================================
                // 4. FILTROS DE SANIDADE E GRAVAÇÃO (ESMAGANDO O BANCO)
                // ==============================================================
                if (rastreioFinalizado && dataEnvioFinal && dataEntregaFinal) {
                    let invalido = false;
                    const d1 = new Date(dataEnvioFinal);
                    const d2 = new Date(dataEntregaFinal);
                    const diffDias = Math.floor((Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate()) - Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())) / (1000 * 60 * 60 * 24));
                    const cepLimpo = (pedido.cep || '').replace(/\D/g, '');

                    if (diffDias > 60 || diffDias < 0) invalido = true;
                    else if (diffDias === 0 && cepLimpo !== '88240000') invalido = true;

                    if (invalido) dataEntregaFinal = null;

                    const envioDB = dataEnvioFinal.toISOString();
                    const entregaDB = dataEntregaFinal ? dataEntregaFinal.toISOString() : null;

                    await sql`
                        UPDATE pedidos_nuvemshop 
                        SET data_envio = ${envioDB},
                            data_entrega = ${entregaDB}
                        WHERE id_pedido = ${pedido.id_pedido};
                    `;

                    if (dataEntregaFinal === null) {
                        anuladosPorErro++;
                        console.log(`🧹 #${pedido.numero_pedido}: Entrega anulada (Regra). Envio: ${dataEnvioFinal.toLocaleDateString('pt-BR')}`);
                    } else {
                        atualizadosComSucesso++;
                        console.log(`✅ #${pedido.numero_pedido} GRAVADO! Envio: ${dataEnvioFinal.toLocaleDateString('pt-BR')} | Entrega: ${dataEntregaFinal.toLocaleDateString('pt-BR')}`);
                    }
                }

            } catch (erroLoop) {
                console.error(`⚠️ Falha ao processar #${pedido.numero_pedido}: ${erroLoop.message}`);
            }
            
            await delay(1200); 
        }

        console.log(`\n🎉 RESTAURAÇÃO CONCLUÍDA! ${atualizadosComSucesso} pedidos corrigidos com sucesso!`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no script:", erro.message);
        process.exit(1);
    }
}

sincronizarDatasReais();