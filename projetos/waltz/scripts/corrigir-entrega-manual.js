// ============================================================================
// SCRIPT: BISTURI MANUAL (OVERRIDE DE DATAS)
// Objetivo: Forçar a gravação de datas de envio e entrega para um pedido específico.
// ============================================================================

require('dotenv').config();
const { sql } = require('@vercel/postgres');

// ---------------------------------------------------------
// 🛠️ ÁREA DE CONFIGURAÇÃO MANUAL
// Altere estes 3 valores sempre que precisar corrigir um pedido rebelde
// Formato da Data: 'YYYY-MM-DDTHH:mm:00-03:00' (Ano-Mês-DiaTHora:Minuto:00-03:00)
// ---------------------------------------------------------
const NUMERO_PEDIDO = '13183';
const DATA_ENVIO = '2026-03-27T17:12:00-03:00'; 
const DATA_ENTREGA = '2026-03-31T17:56:00-03:00';
// ---------------------------------------------------------

async function corrigirPedidoManualmente() {
    console.log(`\n🛠️ BISTURI MANUAL: Corrigindo o pedido #${NUMERO_PEDIDO}...`);

    try {
        // Converte as strings para o formato aceito pelo banco (ISO)
        const envioDB = new Date(DATA_ENVIO).toISOString();
        const entregaDB = new Date(DATA_ENTREGA).toISOString();

        // Faz o UPDATE forçado
        const resultado = await sql`
            UPDATE pedidos_nuvemshop 
            SET data_envio = ${envioDB},
                data_entrega = ${entregaDB}
            WHERE numero_pedido = ${NUMERO_PEDIDO};
        `;

        if (resultado.rowCount > 0) {
            console.log(`✅ SUCESSO! O Pedido #${NUMERO_PEDIDO} foi atualizado à força.`);
            console.log(`   Envio gravado:   ${new Date(DATA_ENVIO).toLocaleString('pt-BR')}`);
            console.log(`   Entrega gravada: ${new Date(DATA_ENTREGA).toLocaleString('pt-BR')}\n`);
        } else {
            console.log(`⚠️ AVISO: Pedido #${NUMERO_PEDIDO} não encontrado no banco de dados.\n`);
        }

        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro fatal ao corrigir pedido:", erro.message);
        process.exit(1);
    }
}

corrigirPedidoManualmente();