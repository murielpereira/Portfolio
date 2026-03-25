// atualizar_tabela.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function adicionarColuna() {
    try {
        console.log("⏳ Adicionando coluna 'telefone' no banco de dados...");
        await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS telefone VARCHAR;`;
        console.log("✅ SUCESSO! A tabela agora suporta telefones.");
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro:", erro);
        process.exit(1);
    }
}
adicionarColuna();