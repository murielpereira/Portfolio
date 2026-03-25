require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function criarTabelaPedidos() {
    try {
        console.log("⏳ Criando tabela de pedidos da Nuvemshop...");
        await sql`
            CREATE TABLE IF NOT EXISTS pedidos_nuvemshop (
                id_pedido VARCHAR PRIMARY KEY,
                numero_pedido VARCHAR NOT NULL,
                data_criacao TIMESTAMP NOT NULL,
                nome_cliente VARCHAR,
                cpf_cliente VARCHAR,
                cidade VARCHAR,
                estado VARCHAR,
                transportadora VARCHAR,
                rastreio VARCHAR,
                status_nuvemshop VARCHAR,
                status_feedback VARCHAR DEFAULT 'Não Enviado',
                data_envio TIMESTAMP
            );
        `;
        console.log("✅ Tabela 'pedidos_nuvemshop' criada com sucesso!");
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro ao criar tabela:", erro);
        process.exit(1);
    }
}
criarTabelaPedidos();