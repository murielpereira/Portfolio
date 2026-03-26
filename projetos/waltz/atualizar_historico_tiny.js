// atualizar_historico_tiny.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const TOKEN = process.env.TINY_TOKEN;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function garimparHistoricoTiny() {
    console.log("🚀 Iniciando o Robô Garimpeiro do Tiny ERP...");

    try {
        // 1. Busca todos os clientes que estão "Sem Compras" no nosso banco
        const { rows: clientesZerados } = await sql`
            SELECT cpf 
            FROM clientes 
            WHERE total_pedidos = 0 OR total_pedidos IS NULL;
        `;

        const total = clientesZerados.length;
        console.log(`🔎 Encontrados ${total} clientes para analisar o histórico. Isso pode demorar algumas horas...\n`);

        let atualizados = 0;
        let vazios = 0;

        // 2. Loop passando por cada CPF encontrado
        for (let i = 0; i < total; i++) {
            const cpf = clientesZerados[i].cpf;

            try {
                // Consulta os pedidos atrelados a este CPF no Tiny
                const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpf}&formato=JSON`;
                const resposta = await fetch(urlBusca);
                const textoResposta = await resposta.text();
                
                const dados = JSON.parse(textoResposta);

                if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.pedidos) {
                    
                    const totalPedidos = dados.retorno.pedidos.length;
                    const valorTotalGasto = dados.retorno.pedidos.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);

                    // Atualiza o nosso banco de dados com a matemática real
                    await sql`
                        UPDATE clientes 
                        SET total_pedidos = ${totalPedidos}, 
                            valor_total = ${valorTotalGasto}
                        WHERE cpf = ${cpf};
                    `;
                    
                    atualizados++;
                    process.stdout.write(`\r✅ Progresso: [${i + 1}/${total}] | CPF: ${cpf} atualizado! Compras: ${totalPedidos}`);
                } else {
                    // Se o Tiny disser que realmente não tem pedido, nós apenas contamos e seguimos
                    vazios++;
                    process.stdout.write(`\r⏳ Progresso: [${i + 1}/${total}] | CPF: ${cpf} realmente não tem pedidos.`);
                }
            } catch (e) {
                console.error(`\n⚠️ Falha ao ler o CPF ${cpf}: ${e.message}`);
            }

            // A PAUSA DE SEGURANÇA (1 segundo = 1000ms)
            await delay(1000); 
        }

        console.log(`\n\n🎉 GARIMPO CONCLUÍDO!`);
        console.log(`📈 Clientes com histórico atualizado: ${atualizados}`);
        console.log(`👻 Clientes confirmados sem compras reais: ${vazios}`);
        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no script:", erro.message);
        process.exit(1);
    }
}

garimparHistoricoTiny();