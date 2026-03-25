require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function atualizarTabela() {
    try {
        console.log("⏳ Conectando ao Vercel Postgres para adicionar a coluna...");
        
        // Adiciona a coluna 'telefone' se ela ainda não existir
        await sql`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone VARCHAR(50);`;
        
        console.log("✅ SUCESSO ABSOLUTO! Coluna 'telefone' (WhatsApp) adicionada com sucesso.");
        process.exit(0);
    } catch (erro) {
        console.error("❌ Falha ao atualizar a tabela:", erro);
        process.exit(1);
    }
}

atualizarTabela();