// atualizar_nuvem.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;

async function atualizarNuvemshop() {
    try {
        console.log("🛠️ 1. Adicionando coluna 'produtos' na tabela (se não existir)...");
        await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS produtos TEXT;`;

        console.log("⏳ 2. Buscando pedidos mais recentes para cobrir buracos...");
        const resposta = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders?per_page=50`, {
            headers: { 'Authentication': `bearer ${ACCESS_TOKEN}`, 'User-Agent': 'Waltz' }
        });

        const pedidos = await resposta.json();
        let salvos = 0;

        for (const dadosPedido of pedidos) {
            const id_pedido = dadosPedido.id.toString();
            const numero_pedido = dadosPedido.number.toString();
            const data_criacao = new Date(dadosPedido.created_at);
            
            let listaProdutos = '';
            if (dadosPedido.products) {
                listaProdutos = dadosPedido.products.map(item => `${item.quantity}x ${item.name}`).join(', ');
            }

            // Apenas atualizamos os produtos e dados de quem escapou
            await sql`
                UPDATE pedidos_nuvemshop 
                SET produtos = ${listaProdutos}, data_criacao = ${data_criacao}
                WHERE id_pedido = ${id_pedido};
            `;
            
            // Se o pedido não existir na base, nós o inserimos (como o 13167)
            await sql`
                INSERT INTO pedidos_nuvemshop (id_pedido, numero_pedido, data_criacao, nome_cliente, produtos)
                VALUES (${id_pedido}, ${numero_pedido}, ${data_criacao}, ${dadosPedido.customer?.name || ''}, ${listaProdutos})
                ON CONFLICT (id_pedido) DO NOTHING; 
            `;
            salvos++;
        }
        console.log(`✅ SUCESSO! ${salvos} pedidos recentes verificados e atualizados com produtos.`);
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro:", erro.message);
        process.exit(1);
    }
}
atualizarNuvemshop();