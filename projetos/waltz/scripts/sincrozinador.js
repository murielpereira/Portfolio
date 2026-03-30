// ============================================================================
// SCRIPT MESTRE: SINCRONIZAÇÃO GLOBAL DEFINITIVA
// Objetivo: Unificar Nuvemshop, Tiny ERP e SmartEnvios num único banco de dados.
// ============================================================================

require('dotenv').config();
const { sql } = require('@vercel/postgres');

// Função auxiliar para criar pausas e evitar bloqueios por excesso de requisições (Rate Limit)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ============================================================================
// FASE 1: NUVEMSHOP (Importação de Pedidos)
// ============================================================================
async function sincronizarNuvemshop() {
    console.log("\n📦 FASE 1: Baixando Pedidos da Nuvemshop...\n");
    const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
    const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
    
    let pagina = 1;
    let temMaisPedidos = true;
    let totalAtualizados = 0;

    while (temMaisPedidos) {
        process.stdout.write(`📥 Lendo página ${pagina} da Nuvemshop...\r`);
        const url = `https://api.nuvemshop.com.br/v1/${STORE_ID}/orders?page=${pagina}&per_page=50`;
        
        try {
            const resposta = await fetch(url, { headers: { 'Authentication': `bearer ${TOKEN_NUVEM}`, 'User-Agent': 'Waltz Automação' } });
            if (!resposta.ok) { console.error(`\n❌ Erro na Nuvemshop (Página ${pagina}). Status: ${resposta.status}`); break; }

            const pedidos = await resposta.json();
            if (pedidos.length === 0) { temMaisPedidos = false; break; }

            for (const dadosPedido of pedidos) {
                const id_pedido = dadosPedido.id.toString();
                const numero_pedido = dadosPedido.number.toString();
                const data_criacao = new Date(dadosPedido.created_at);
                const data_envio = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
                
                const cliente = dadosPedido.customer ? dadosPedido.customer.name : 'Desconhecido';
                const cpf = dadosPedido.customer && dadosPedido.customer.identification ? dadosPedido.customer.identification.replace(/\D/g, '') : '';
                const telefone = dadosPedido.customer && dadosPedido.customer.phone ? dadosPedido.customer.phone : '';
                const email_cliente = dadosPedido.customer && dadosPedido.customer.email ? dadosPedido.customer.email : '';
                
                const cidade = dadosPedido.shipping_address ? dadosPedido.shipping_address.city : '';
                const estado = dadosPedido.shipping_address ? dadosPedido.shipping_address.province : '';
                const cep_cliente = dadosPedido.shipping_address && dadosPedido.shipping_address.zipcode ? dadosPedido.shipping_address.zipcode : '';
                const endereco_completo = dadosPedido.shipping_address ? `${dadosPedido.shipping_address.address}, ${dadosPedido.shipping_address.number} - ${dadosPedido.shipping_address.locality}` : '';
                
                let transportadora = dadosPedido.shipping_option || '';
                transportadora = transportadora.replace(/via SmartEnvios/gi, '').trim();
                const rastreio = dadosPedido.shipping_tracking_number || '';
                
                const valor_total = parseFloat(dadosPedido.total || 0);
                const valor_frete = parseFloat(dadosPedido.shipping_cost_owner || dadosPedido.shipping_cost_customer || 0);

                let status = 'Aberto';
                const stPrincipal = (dadosPedido.status || '').toLowerCase();
                const stEnvio = (dadosPedido.shipping_status || '').toLowerCase();

                if (stPrincipal === 'closed' || stEnvio === 'delivered') status = 'Entregue';
                else if (stEnvio === 'shipped') status = 'Enviado'; 
                else if (stPrincipal === 'canceled' || stPrincipal === 'cancelled') status = 'Cancelado';

                let data_entrega = null;
                if (status === 'Entregue') data_entrega = dadosPedido.finished_at ? new Date(dadosPedido.finished_at) : new Date();

                let listaProdutos = '';
                if (dadosPedido.products && Array.isArray(dadosPedido.products)) {
                    listaProdutos = dadosPedido.products.map(item => `${item.quantity}x ${item.name}`).join(', ');
                }

                await sql`
                    INSERT INTO pedidos_nuvemshop (
                        id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone, email_cliente,
                        cidade, estado, cep, endereco_completo, transportadora, rastreio, status_nuvemshop, data_envio, produtos,
                        valor_total, valor_frete, data_entrega
                    )
                    VALUES (
                        ${id_pedido}, ${numero_pedido}, ${data_criacao}, ${cliente}, ${cpf}, ${telefone}, ${email_cliente},
                        ${cidade}, ${estado}, ${cep_cliente}, ${endereco_completo}, ${transportadora}, ${rastreio}, ${status}, ${data_envio}, ${listaProdutos},
                        ${valor_total}, ${valor_frete}, ${data_entrega}
                    )
                    ON CONFLICT (id_pedido) DO UPDATE SET 
                        nome_cliente = EXCLUDED.nome_cliente, cpf_cliente = EXCLUDED.cpf_cliente, telefone = EXCLUDED.telefone, email_cliente = EXCLUDED.email_cliente,
                        cidade = EXCLUDED.cidade, estado = EXCLUDED.estado, cep = EXCLUDED.cep, endereco_completo = EXCLUDED.endereco_completo,
                        transportadora = EXCLUDED.transportadora, rastreio = EXCLUDED.rastreio, status_nuvemshop = EXCLUDED.status_nuvemshop,
                        data_envio = EXCLUDED.data_envio, produtos = EXCLUDED.produtos, valor_total = EXCLUDED.valor_total, valor_frete = EXCLUDED.valor_frete,
                        data_entrega = CASE WHEN EXCLUDED.status_nuvemshop = 'Entregue' AND pedidos_nuvemshop.data_entrega IS NULL THEN EXCLUDED.data_entrega ELSE pedidos_nuvemshop.data_entrega END;
                `;
                totalAtualizados++;
            }
            pagina++;
            await delay(500); 
        } catch (e) {
            console.log(`\n⚠️ Erro de conexão na página ${pagina}. Tentando prosseguir...`);
        }
    }
    console.log(`\n✅ Fase 1 Concluída! ${totalAtualizados} pedidos importados/atualizados.`);
}

// ============================================================================
// FASE 2: TINY ERP (Contatos e Unificação por CPF)
// ============================================================================
async function sincronizarContatosTiny() {
    console.log("\n👥 FASE 2: Baixando Contatos do Tiny ERP (Unificando CPFs)...\n");
    const TOKEN = process.env.TINY_TOKEN;
    let pagina = 1; let temMais = true; let salvos = 0;

    while(temMais) {
        process.stdout.write(`Lendo página ${pagina} de clientes do Tiny...\r`);
        try {
            const url = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resp = await fetch(url);
            const dados = await resp.json();

            if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.contatos) {
                const totalPaginasTiny = dados.retorno.numero_paginas;
                for (const item of dados.retorno.contatos) {
                    const c = item.contato;
                    const tipos = JSON.stringify(c.tipos_contato || '').toLowerCase();
                    if (tipos !== '""' && !tipos.includes('cliente')) continue;

                    const cpfLimpo = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : null;
                    if (cpfLimpo) {
                        await sql`
                            INSERT INTO clientes (cpf, nome, telefone, email, cidade, estado)
                            VALUES (${cpfLimpo}, ${c.nome || 'Desconhecido'}, ${c.celular || c.fone || ''}, ${c.email || ''}, ${c.cidade || ''}, ${c.uf || ''})
                            ON CONFLICT (cpf) DO UPDATE SET
                                nome = CASE WHEN EXCLUDED.nome != '' THEN EXCLUDED.nome ELSE clientes.nome END,
                                telefone = CASE WHEN EXCLUDED.telefone != '' THEN EXCLUDED.telefone ELSE clientes.telefone END,
                                email = CASE WHEN EXCLUDED.email != '' THEN EXCLUDED.email ELSE clientes.email END,
                                cidade = CASE WHEN EXCLUDED.cidade != '' THEN EXCLUDED.cidade ELSE clientes.cidade END,
                                estado = CASE WHEN EXCLUDED.estado != '' THEN EXCLUDED.estado ELSE clientes.estado END;
                        `;
                        salvos++;
                    }
                }
                if (pagina >= totalPaginasTiny) temMais = false; else pagina++;
            } else { temMais = false; }
        } catch (e) { console.log(`\n⚠️ Erro na página ${pagina} do Tiny. Prosseguindo...`); temMais = false; }
        await delay(1000); 
    }
    console.log(`\n✅ Fase 2 Concluída! ${salvos} clientes mesclados no banco.`);
}

// ============================================================================
// FASE 3: TINY ERP (Histórico Financeiro - Matriz RFM)
// ============================================================================
async function sincronizarFinanceiroTiny() {
    console.log("\n💰 FASE 3: Atualizando Histórico Financeiro (LTV e Frequência)...\n");
    const TOKEN = process.env.TINY_TOKEN;
    const { rows: clientes } = await sql`SELECT cpf FROM clientes WHERE cpf != '';`;
    
    let atualizados = 0; let contador = 0;
    for (const cli of clientes) {
        contador++;
        process.stdout.write(`Consultando CPF ${contador} de ${clientes.length} (${Math.round((contador/clientes.length)*100)}%)...\r`);
        try {
            const url = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cli.cpf}&formato=JSON`;
            const resp = await fetch(url);
            const dados = await resp.json();

            if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.pedidos) {
                const totalPedidos = dados.retorno.pedidos.length;
                const valorTotal = dados.retorno.pedidos.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);
                await sql`UPDATE clientes SET total_pedidos = ${totalPedidos}, valor_total = ${valorTotal} WHERE cpf = ${cli.cpf};`;
                atualizados++;
            }
        } catch (e) {}
        await delay(1000); 
    }
    console.log(`\n✅ Fase 3 Concluída! Financeiro atualizado para ${atualizados} clientes.`);
}

// ============================================================================
// FASE 4: SMARTENVIOS E NUVEMSHOP (Auditoria de Logística e Status Final)
// ============================================================================
async function auditoriaLogisticaRastreio() {
    console.log("\n🚚 FASE 4: Auditando Rastreios e Forçando Arquivamento...\n");
    const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
    const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
    const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;

    // Pega todos os pedidos que TÊM rastreio, mas que ainda não anotamos a data final de entrega
    const { rows: pedidosPendentes } = await sql`
        SELECT id_pedido, numero_pedido, rastreio 
        FROM pedidos_nuvemshop
        WHERE rastreio IS NOT NULL AND rastreio != '' AND data_entrega IS NULL
        ORDER BY data_criacao DESC;
    `;

    console.log(`🔎 Encontrados ${pedidosPendentes.length} pedidos a aguardar confirmação de entrega da transportadora.`);
    
    let corrigidos = 0;
    let contador = 0;

    for (const pedido of pedidosPendentes) {
        contador++;
        process.stdout.write(`Verificando rastreio do pedido #${pedido.numero_pedido} (${contador}/${pedidosPendentes.length})...\r`);
        
        try {
            const resposta = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
                body: JSON.stringify({ "tracking_code": pedido.rastreio })
            });

            if (resposta.ok) {
                const json = await resposta.json();
                const resultado = json.result;

                if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                    const eventos = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                    const ultimoEvento = eventos[eventos.length - 1];
                    
                    // Se o pacote foi efetivamente entregue ao cliente...
                    if (ultimoEvento.code.tracking_type === 'DELIVERED') {
                        const dataColetaReal = new Date(eventos[0].date);
                        const dataEntregaReal = new Date(ultimoEvento.date);

                        // 1. Força a Nuvemshop a arquivar (se já estiver, ela apenas ignora)
                        await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                            method: "PUT",
                            headers: { 'Authentication': `bearer ${TOKEN_NUVEM}`, 'Content-Type': 'application/json', 'User-Agent': 'Waltz' },
                            body: JSON.stringify({ status: "closed" })
                        });

                        // 2. Atualiza as datas precisas e o status no nosso banco de dados
                        await sql`
                            UPDATE pedidos_nuvemshop 
                            SET data_envio = ${dataColetaReal}, 
                                data_entrega = ${dataEntregaReal},
                                status_nuvemshop = 'Entregue'
                            WHERE id_pedido = ${pedido.id_pedido};
                        `;
                        corrigidos++;
                    }
                }
            }
        } catch (e) {
            // Silencia o erro de um pedido específico para continuar o loop
        }
        await delay(500); // Pausa para não sobrecarregar a API da SmartEnvios
    }
    console.log(`\n✅ Fase 4 Concluída! ${corrigidos} pedidos foram confirmados como Entregues e atualizados.`);
}

// ============================================================================
// MOTOR PRINCIPAL (Execução Sequencial)
// ============================================================================
async function iniciarSincronizacaoGlobal() {
    try {
        await sincronizarNuvemshop();          // Fase 1
        await sincronizarContatosTiny();       // Fase 2
        await sincronizarFinanceiroTiny();     // Fase 3
        await auditoriaLogisticaRastreio();    // Fase 4
        
        console.log("\n=======================================================");
        console.log(`🎉 SINCRONIZAÇÃO GLOBAL FINALIZADA COM SUCESSO!`);
        console.log("O seu sistema está perfeitamente alinhado, limpo e atualizado.");
        console.log("A partir de agora, o Webhook e o Cronjob cuidarão do resto automaticamente!");
        console.log("=======================================================\n");
        process.exit(0);

    } catch (erroGeral) {
        console.error("\n❌ Erro fatal no script mestre:", erroGeral.message);
        process.exit(1);
    }
}

// Inicia a magia!
iniciarSincronizacaoGlobal();