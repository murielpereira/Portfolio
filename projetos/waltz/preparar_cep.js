// preparar_cep.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function prepararBancoParaCEPs() {
    console.log("🛠️ Criando a nova coluna de CEP para análise regional...");
    
    try {
        // Adiciona a coluna 'cep' na nossa tabela de pedidos.
        // Usamos VARCHAR(20) para garantir espaço para CEPs formatados (ex: 85864-040)
        await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS cep VARCHAR(20);`;
        
        console.log("✅ Sucesso Absoluto! A coluna 'cep' foi adicionada ao banco de dados.");
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro ao preparar banco:", erro.message);
        process.exit(1);
    }
}

prepararBancoParaCEPs();