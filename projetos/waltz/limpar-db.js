require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function fazerFaxina() {
    try {
        console.log("⏳ Conectando ao banco de dados para a faxina...");
        
        // O comando DELETE apaga todas as linhas onde o total_pedidos for 0 ou nulo
        const resultado = await sql`
            DELETE FROM clientes 
            WHERE total_pedidos = 0 OR total_pedidos IS NULL;
        `;
        
        console.log(`✅ SUCESSO! Faxina concluída. Clientes sem compras foram removidos.`);
        process.exit(0);
    } catch (erro) {
        console.error("❌ Falha ao limpar o banco de dados:", erro);
        process.exit(1);
    }
}

fazerFaxina();