// importar_pedidos_antigos.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;

// Função auxiliar para criar uma pausa entre as requisições (evita bloqueio da API)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function importarPedidosHistoricos() {
    console.log("⏳ Iniciando resgate em lote de até 1000 pedidos antigos...");

    let salvosTotal = 0;
    let paginaAtual = 1;
    let temMaisPaginas = true;

    try {
        // O Laço de Repetição: continua rodando enquanto houver páginas e não bater 1000
        while (temMaisPaginas && salvosTotal < 1000) {
            console.log(`\n📄 Buscando página ${paginaAtual}...`);

            // Parâmetros: limite seguro de 50 itens por página, apontando para a página atual
            const url = `https://api.nuvemshop.com.br/v1/${STORE_ID}/orders?per_page=50&page=${paginaAtual}`;

            const resposta = await fetch(url, {
                headers: {
                    'Authentication': `bearer ${ACCESS_TOKEN}`,
                    'User-Agent': 'Waltz (murielpereirabr@gmail.com)'
                }
            });

            // Se a API retornar erro, paramos o código e mostramos o motivo real
            if (!resposta.ok) {
                const erroTxt = await resposta.text();
                throw new Error(`Status ${resposta.status} - ${erroTxt}`);
            }

            const pedidos = await resposta.json();

            // Se a página vier vazia, significa que já baixamos tudo o que existia na loja
            if (pedidos.length === 0) {
                console.log("📭 Não há mais pedidos antigos para baixar na Nuvemshop.");
                temMaisPaginas = false;
                break;
            }

            console.log(`📦 Encontrados ${pedidos.length} pedidos. Inserindo no Banco de Dados...`);

            // Passa por cada pedido da página atual e salva no nosso banco
            for (const dadosPedido of pedidos) {
                // Trava de segurança extra para parar exatamente em 1000
                if (salvosTotal >= 1000) break;

                const id_pedido = dadosPedido.id.toString();
                const numero_pedido = dadosPedido.number.toString();
                const data_criacao = new Date(dadosPedido.created_at);
                const data_envio = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
                
                const cliente = dadosPedido.customer ? dadosPedido.customer.name : 'Desconhecido';
                // Usando validação segura (&&) para garantir que o 'identification' existe antes de usar o replace
                const cpf = (dadosPedido.customer && dadosPedido.customer.identification) ? dadosPedido.customer.identification.replace(/\D/g, '') : '';
                const cidade = dadosPedido.shipping_address ? dadosPedido.shipping_address.city : '';
                const estado = dadosPedido.shipping_address ? dadosPedido.shipping_address.province : '';
                
                // Limpeza da transportadora
                let transportadora = dadosPedido.shipping_option || '';
                transportadora = transportadora.replace(/via SmartEnvios/gi, '').trim();
                
                const rastreio = dadosPedido.shipping_tracking_number || '';
                
                let status = 'Aberto';
                if (dadosPedido.status === 'closed') status = 'Arquivado';
                if (dadosPedido.status === 'canceled') status = 'Cancelado';

                // O comando UPSERT (Insere ou Atualiza)
                await sql`
                    INSERT INTO pedidos_nuvemshop (
                        id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, 
                        cidade, estado, transportadora, rastreio, status_nuvemshop, data_envio
                    )
                    VALUES (
                        ${id_pedido}, ${numero_pedido}, ${data_criacao}, ${cliente}, ${cpf}, 
                        ${cidade}, ${estado}, ${transportadora}, ${rastreio}, ${status}, ${data_envio}
                    )
                    ON CONFLICT (id_pedido) DO UPDATE SET 
                        transportadora = EXCLUDED.transportadora,
                        rastreio = EXCLUDED.rastreio,
                        status_nuvemshop = EXCLUDED.status_nuvemshop,
                        data_envio = EXCLUDED.data_envio;
                `;
                salvosTotal++;
            }

            // Descansa 1 segundo antes de pedir a próxima página (Evita bloqueio da Nuvemshop)
            await delay(1000);
            
            // Vai para a próxima página no próximo giro do loop
            paginaAtual++;
        }

        console.log(`\n✅ SUCESSO ABSOLUTO! ${salvosTotal} pedidos históricos foram salvos no banco de dados.`);
        process.exit(0);

    } catch (erro) {
        console.error("\n❌ Falha ao resgatar pedidos:", erro.message);
        process.exit(1);
    }
}

importarPedidosHistoricos();