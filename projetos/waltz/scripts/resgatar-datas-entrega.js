// ============================================================================
// SCRIPT: AUDITORIA LOGÍSTICA (SMARTENVIOS + FALLBACK NUVEMSHOP)
// Objetivo: Consultar as datas precisas ou usar o arquivamento da Nuvemshop.
// ============================================================================

require('dotenv').config();
const { sql } = require('@vercel/postgres');

// Função para pausas (evitar bloqueios)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ============================================================================
// ESTRATÉGIA 1: SMARTENVIOS (Alta Precisão)
// ============================================================================
async function consultarSmartEnvios(codigoRastreio) {
    const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
    try {
        const resposta = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
            body: JSON.stringify({ "tracking_code": codigoRastreio })
        });

        if (resposta.ok) {
            const json = await resposta.json();
            const resultado = json.result;

            if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                const eventos = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                const ultimoEvento = eventos[eventos.length - 1];

                if (ultimoEvento.code.tracking_type === 'DELIVERED') {
                    return {
                        sucesso: true,
                        origem: 'SmartEnvios',
                        data_envio: new Date(eventos[0].date),
                        data_entrega: new Date(ultimoEvento.date)
                    };
                }
            }
        }
        return { sucesso: false };
    } catch (erro) {
        return { sucesso: false };
    }
}

// ============================================================================
// ESTRATÉGIA 2: FALLBACK NUVEMSHOP (Outras Transportadoras)
// ============================================================================
async function consultarNuvemshopFallback(idPedido) {
    const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
    const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
    
    try {
        const resposta = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${idPedido}`, {
            headers: { 'Authentication': `bearer ${TOKEN_NUVEM}`, 'User-Agent': 'Waltz Automação' }
        });

        if (resposta.ok) {
            const dadosPedido = await resposta.json();
            
            // Pega a data de envio oficial
            const dataEnvio = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
            
            // Pega a data de arquivamento (finished_at) como substituta da data de entrega
            // Se não houver arquivamento, usa a última vez que o pedido foi atualizado como último recurso
            const dataEntrega = dadosPedido.finished_at ? new Date(dadosPedido.finished_at) : new Date(dadosPedido.updated_at);

            return {
                sucesso: true,
                origem: 'Nuvemshop (Arquivamento)',
                data_envio: dataEnvio,
                data_entrega: dataEntrega
            };
        }
        return { sucesso: false };
    } catch (erro) {
        return { sucesso: false };
    }
}

// ============================================================================
// MOTOR PRINCIPAL DO SCRIPT
// ============================================================================
async function auditarDatasLogistica() {
    console.log("\n🕵️ Iniciando Auditoria Logística Definitiva...\n");

    try {
        // Seleciona todos os pedidos que já constam como Entregues
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio, transportadora
            FROM pedidos_nuvemshop
            WHERE status_nuvemshop = 'Entregue'
            ORDER BY data_criacao DESC;
        `;

        console.log(`📦 Encontrados ${pedidos.length} pedidos entregues para verificação.\n`);

        let corrigidosSmart = 0;
        let corrigidosNuvem = 0;
        let falhas = 0;

        for (let i = 0; i < pedidos.length; i++) {
            const pedido = pedidos[i];
            const transportadora = (pedido.transportadora || '').toLowerCase();
            
            process.stdout.write(`⏳ Analisando #${pedido.numero_pedido} via [${pedido.transportadora || 'Desconhecida'}]...\r`);

            let resultadoLogistica = { sucesso: false };

            // ROTEADOR: Decide a origem dos dados
            if (pedido.rastreio && (transportadora.includes('smartenvios') || transportadora.includes('j&t'))) {
                resultadoLogistica = await consultarSmartEnvios(pedido.rastreio);
            } 
            
            // Se a SmartEnvios falhou ou se for outra transportadora, cai no Fallback da Nuvemshop
            if (!resultadoLogistica.sucesso) {
                resultadoLogistica = await consultarNuvemshopFallback(pedido.id_pedido);
            }

            // APLICAÇÃO DOS DADOS NO BANCO
            if (resultadoLogistica.sucesso && resultadoLogistica.data_envio && resultadoLogistica.data_entrega) {
                await sql`
                    UPDATE pedidos_nuvemshop 
                    SET data_envio = ${resultadoLogistica.data_envio}, 
                        data_entrega = ${resultadoLogistica.data_entrega}
                    WHERE id_pedido = ${pedido.id_pedido};
                `;
                
                if (resultadoLogistica.origem === 'SmartEnvios') corrigidosSmart++;
                else corrigidosNuvem++;
                
            } else {
                falhas++;
            }

            await delay(500); // Respeita os limites das APIs
        }

        console.log(`\n\n✅ Auditoria Concluída!`);
        console.log(`✨ ${corrigidosSmart} pedidos atualizados com alta precisão via SmartEnvios.`);
        console.log(`📌 ${corrigidosNuvem} pedidos atualizados usando a data de arquivamento da Nuvemshop.`);
        console.log(`⚠️ ${falhas} pedidos não puderam ser verificados.`);
        process.exit(0);

    } catch (erro) {
        console.error("\n❌ Erro fatal:", erro.message);
        process.exit(1);
    }
}

auditarDatasLogistica();