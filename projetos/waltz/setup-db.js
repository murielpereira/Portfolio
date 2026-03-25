require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function criarTabelaClientes() {
    try {
        console.log("⏳ Conectando ao Vercel Postgres...");
        
        // O comando SQL que cria a nossa tabela de clientes
        await sql`
            CREATE TABLE IF NOT EXISTS clientes (
                cpf VARCHAR(20) PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                cidade VARCHAR(255),
                estado VARCHAR(50),
                total_pedidos INT DEFAULT 0,
                valor_total DECIMAL(10, 2) DEFAULT 0.00,
                ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        console.log("✅ SUCESSO ABSOLUTO! Tabela 'clientes' criada e pronta para uso.");
        process.exit(0); // Encerra o script com sucesso
    } catch (erro) {
        console.error("❌ Falha ao criar a tabela:", erro);
        process.exit(1);
    }
}

criarTabelaClientes();