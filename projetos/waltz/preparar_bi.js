// preparar_bi.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function prepararBancoBI() {
    console.log("🛠️ Criando novas colunas para Inteligência de Negócio (BI)...");
    
    try {
        // Cria as colunas financeiras na tabela da Nuvemshop
        await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS valor_total DECIMAL(10,2);`;
        await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS valor_frete DECIMAL(10,2);`;
        
        // Cria a coluna de data para calcularmos o tempo de entrega
        await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMP;`;
        
        console.log("✅ Sucesso Absoluto! O banco de dados está pronto com as novas colunas.");
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro ao preparar banco:", erro.message);
        process.exit(1);
    }
}

prepararBancoBI();