require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const { sql } = require('@vercel/postgres');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
    name: 'sessao-automacao',
    keys: [process.env.CHAVE_SECRETA_SESSAO],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, 
    sameSite: 'lax' 
}));

app.use(express.static(path.join(__dirname, 'public')));

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ==========================================
// FUNÇÃO: ATUALIZAR OBSERVAÇÕES INTERNAS NO TINY ERP
// ==========================================
async function atualizarObservacaoTiny(idPedidoTiny, observacaoInterna) {
    console.log(`\n📝 TINY API: Escrevendo observação INTERNA no pedido ID: ${idPedidoTiny}`);
    
    const TOKEN = process.env.TINY_TOKEN;
    const urlTiny = `https://erp.tiny.com.br/api2/pedido.alterar.php?token=${TOKEN}&id=${idPedidoTiny}&formato=JSON`;
    
    const corpoRaw = JSON.stringify({
        "dados_pedido": { "obs_interna": observacaoInterna }
    });

    try {
        const resposta = await fetch(urlTiny, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: corpoRaw
        });

        const dadosJson = await resposta.json();
        if (dadosJson.retorno && dadosJson.retorno.status === 'OK') {
            console.log(`✅ Observação interna injetada com sucesso no pedido ${idPedidoTiny}!`);
            return true;
        } else {
            console.error(`⚠️ O Tiny recusou a atualização da observação:`, dadosJson.retorno.erros);
            return false;
        }
    } catch (erro) {
        console.error(`❌ Erro ao tentar atualizar observação no Tiny:`, erro.message);
        return false;
    }
}

// ==========================================
// ROTAS DE SESSÃO E LOGIN
// ==========================================
app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.logado) res.json({ logado: true });
    else res.json({ logado: false });
});

app.post('/api/login', (req, res) => {
    const USUARIO_SECRETO = process.env.PAINEL_USUARIO;
    const SENHA_SECRETA = process.env.PAINEL_SENHA;

    if (!USUARIO_SECRETO || !SENHA_SECRETA) {
        return res.status(500).json({ sucesso: false, erro: 'Configuração de segurança ausente.' });
    }

    if (req.body.usuario === USUARIO_SECRETO && req.body.senha === SENHA_SECRETA) {
        req.session.logado = true; 
        res.json({ sucesso: true });
    } else { 
        res.json({ sucesso: false }); 
    }
});

app.get('/api/logout', (req, res) => { 
    req.session = null; 
    res.json({ sucesso: true }); 
});

// ==========================================
// API DE PEDIDOS E FEEDBACK
// ==========================================
app.get('/api/pedidos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows: pedidos } = await sql`SELECT * FROM pedidos_nuvemshop WHERE status_nuvemshop != 'Cancelado' ORDER BY data_criacao DESC;`;
        res.json(pedidos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro interno ao carregar pedidos salvos.' });
    }
});

app.post('/api/pedidos/marcar-feedback', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { id_pedido } = req.body;
        await sql`UPDATE pedidos_nuvemshop SET status_feedback = 'Enviado' WHERE id_pedido = ${id_pedido};`;
        res.json({ sucesso: true });
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: 'Falha no banco de dados.' });
    }
});

async function fetchComRetry(url, options, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
        } catch (e) {}
        if (i < tentativas - 1) await delay(2000); 
    }
    throw new Error("Falha no fetch após 3 tentativas.");
}

// ==========================================
// WEBHOOK: NUVEMSHOP (Com Captura de E-mail)
// ==========================================
const pedidosEmProcessamentoNuvem = new Set();

app.post('/api/webhook/nuvemshop', async (req, res) => {
    const payload = req.body;
    if (!payload || !payload.id) return res.status(200).send('Ignorado - Sem ID'); 

    const idPedidoNuvem = payload.id.toString();
    const evento = payload.event || req.headers['x-linked-store-event'] || 'Atualização';

    if (pedidosEmProcessamentoNuvem.has(idPedidoNuvem)) {
        return res.status(200).send('Eco ignorado'); 
    }

    pedidosEmProcessamentoNuvem.add(idPedidoNuvem);
    setTimeout(() => { pedidosEmProcessamentoNuvem.delete(idPedidoNuvem); }, 10000); 

    try {
        const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
        const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;

        const resposta = await fetchComRetry(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${idPedidoNuvem}`, {
            headers: { 'Authentication': `bearer ${ACCESS_TOKEN}`, 'User-Agent': 'Waltz' }
        });

        const dadosPedido = await resposta.json();

        const id_pedido = dadosPedido.id.toString();
        const numero_pedido = dadosPedido.number.toString();
        const data_criacao = new Date(dadosPedido.created_at);
        const data_envio = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
        
        const cliente = dadosPedido.customer ? dadosPedido.customer.name : 'Desconhecido';
        const cpf = dadosPedido.customer && dadosPedido.customer.identification ? dadosPedido.customer.identification.replace(/\D/g, '') : '';
        const telefone = dadosPedido.customer && dadosPedido.customer.phone ? dadosPedido.customer.phone : '';
        const email_cliente = dadosPedido.customer && dadosPedido.customer.email ? dadosPedido.customer.email : ''; // 👈 CAPTURA DO E-MAIL
        const cidade = dadosPedido.shipping_address ? dadosPedido.shipping_address.city : '';
        const estado = dadosPedido.shipping_address ? dadosPedido.shipping_address.province : '';
        const cep_cliente = dadosPedido.shipping_address && dadosPedido.shipping_address.zipcode ? dadosPedido.shipping_address.zipcode : '';
        
        let transportadora = dadosPedido.shipping_option || '';
        transportadora = transportadora.replace(/via SmartEnvios/gi, '').trim();
        const rastreio = dadosPedido.shipping_tracking_number || '';
        
        const valor_total = parseFloat(dadosPedido.total || 0);
        const valor_frete = parseFloat(dadosPedido.shipping_cost_owner || dadosPedido.shipping_cost_customer || 0);

        let status = 'Aberto';
        const statusPrincipal = (dadosPedido.status || '').toLowerCase();
        const statusPagamento = (dadosPedido.payment_status || '').toLowerCase();
        const statusEnvio = (dadosPedido.shipping_status || '').toLowerCase();

        // 2. UNIFICAÇÃO: "Closed" (Arquivado) ou "Delivered" viram apenas "Entregue"
        if (statusPrincipal === 'closed' || statusEnvio === 'delivered') status = 'Entregue';
        else if (statusEnvio === 'shipped') status = 'Enviado'; 
        
        if (statusPrincipal === 'canceled' || statusPrincipal === 'cancelled' || statusPagamento === 'canceled' || statusPagamento === 'voided' || statusPagamento === 'abandoned') {
            status = 'Cancelado';
        }

        let data_entrega = null;
        if (status === 'Entregue') data_entrega = new Date();

        let listaProdutos = '';
        if (dadosPedido.products && Array.isArray(dadosPedido.products)) {
            listaProdutos = dadosPedido.products.map(item => `${item.quantity}x ${item.name}`).join(', ');
        }

        // SALVA NO BANCO (INCLUINDO E-MAIL)
        await sql`
            INSERT INTO pedidos_nuvemshop (
                id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone, email_cliente,
                cidade, estado, transportadora, rastreio, status_nuvemshop, data_envio, produtos,
                valor_total, valor_frete, data_entrega, cep
            )
            VALUES (
                ${id_pedido}, ${numero_pedido}, ${data_criacao}, ${cliente}, ${cpf}, ${telefone}, ${email_cliente},
                ${cidade}, ${estado}, ${transportadora}, ${rastreio}, ${status}, ${data_envio}, ${listaProdutos},
                ${valor_total}, ${valor_frete}, ${data_entrega}, ${cep_cliente}
            )
            ON CONFLICT (id_pedido) DO UPDATE SET 
                nome_cliente = EXCLUDED.nome_cliente,
                cpf_cliente = EXCLUDED.cpf_cliente,
                telefone = EXCLUDED.telefone,
                email_cliente = EXCLUDED.email_cliente,
                cidade = EXCLUDED.cidade,
                estado = EXCLUDED.estado,
                transportadora = EXCLUDED.transportadora,
                rastreio = EXCLUDED.rastreio,
                status_nuvemshop = EXCLUDED.status_nuvemshop,
                data_envio = EXCLUDED.data_envio,
                produtos = EXCLUDED.produtos,
                valor_total = EXCLUDED.valor_total,
                valor_frete = EXCLUDED.valor_frete,
                cep = CASE WHEN EXCLUDED.cep != '' THEN EXCLUDED.cep ELSE pedidos_nuvemshop.cep END,
                data_entrega = CASE WHEN (EXCLUDED.status_nuvemshop = 'Entregue' OR EXCLUDED.status_nuvemshop = 'Arquivado') AND pedidos_nuvemshop.data_entrega IS NULL THEN EXCLUDED.data_entrega ELSE pedidos_nuvemshop.data_entrega END;
        `;
        
        res.status(200).send('Processado e salvo com sucesso');
    } catch (erro) {
        res.status(200).send('Falha interna, mas recebido'); 
    }
});

// ============================================================================
// MÓDULO LOGÍSTICO: MOTOR DE VERIFICAÇÃO DE RASTREIOS (SMARTENVIOS)
// ============================================================================

/**
 * Função central para processar rastreios.
 * @param {number} limite - Quantidade máxima de pedidos para evitar Timeout.
 * @returns {object} - Relatório do processamento.
 */
async function processarRastreiosLogistica(limite = 20) {
    let atualizados = 0;
    let logProcessamento = [];

    try {
        // 1. Puxa os pedidos pendentes (Priorizando os MAIS RECENTES para a fila não travar)
        const { rows: pedidosPendentes } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL 
              AND rastreio != '' 
              AND status_nuvemshop IN ('Aberto', 'Enviado')
            ORDER BY data_criacao DESC 
            LIMIT ${limite};
        `;

        if (pedidosPendentes.length === 0) {
            return { sucesso: true, mensagem: "Nenhum pedido pendente de verificação de rastreio no momento.", log: [] };
        }

        // NOVIDADE: O robô agora avisa quantos pedidos pegou para analisar
        logProcessamento.push(`📦 Lote selecionado: O robô está analisando ${pedidosPendentes.length} pedido(s)...`);
        logProcessamento.push(`--------------------------------------------------`);

        const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
        const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
        const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
        const URL_API = "https://api.smartenvios.com/v1/freight-order/tracking";

        // 2. Itera sobre o lote de pedidos
        for (const pedido of pedidosPendentes) {
            try {
                const respostaSmart = await fetch(URL_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    const resultado = jsonSmart.result;

                    // Se houver eventos de rastreio na transportadora...
                    if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                        const eventosOrdenados = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const ultimoEvento = eventosOrdenados[eventosOrdenados.length - 1];
                        const statusAtual = ultimoEvento.code.tracking_type;
                        
                        // SE FOR ENTREGUE: Faz as atualizações
                        if (statusAtual === 'DELIVERED') {
                            const dataColetaReal = new Date(eventosOrdenados[0].date);
                            const dataEntregaReal = new Date(ultimoEvento.date);

                            const respostaNuvem = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                                method: "PUT",
                                headers: { 'Authentication': `bearer ${TOKEN_NUVEM}`, 'Content-Type': 'application/json', 'User-Agent': 'Waltz' },
                                body: JSON.stringify({ status: "closed" })
                            });

                            if (respostaNuvem.ok) {
                                await sql`
                                    UPDATE pedidos_nuvemshop 
                                    SET status_nuvemshop = 'Entregue', 
                                        data_envio = ${dataColetaReal}, 
                                        data_entrega = ${dataEntregaReal}
                                    WHERE id_pedido = ${pedido.id_pedido};
                                `;
                                atualizados++;
                                logProcessamento.push(`✅ Pedido #${pedido.numero_pedido} atualizado para ENTREGUE!`);
                            } else {
                                logProcessamento.push(`⚠️ Falha ao atualizar pedido #${pedido.numero_pedido} na Nuvemshop.`);
                            }
                        } else {
                            // NOVIDADE: Loga o que está a acontecer com quem ainda não foi entregue
                            logProcessamento.push(`🚚 Pedido #${pedido.numero_pedido} segue em trânsito (Status Atual: ${statusAtual}).`);
                        }
                    } else {
                        // NOVIDADE: Loga caso a transportadora ainda não tenha bipado o pacote
                        logProcessamento.push(`⏳ Pedido #${pedido.numero_pedido} aguardando a primeira atualização da transportadora.`);
                    }
                } else {
                    logProcessamento.push(`❌ Erro de comunicação com a SmartEnvios para o pedido #${pedido.numero_pedido}.`);
                }
            } catch (erroLoop) {
                logProcessamento.push(`❌ Erro interno ao verificar pedido #${pedido.numero_pedido}.`);
            }
            
            await delay(500); // Pausa de segurança
        }

        return { sucesso: true, mensagem: `Resumo: ${atualizados} pedidos foram confirmados como recém-entregues e arquivados.`, log: logProcessamento };

    } catch (erro) {
        console.error("❌ Erro fatal no Motor de Rastreamento:", erro.message);
        return { sucesso: false, erro: "Falha na verificação geral do banco de dados." };
    }
}

// ============================================================================
// 1. SCRIPT MANUAL: ROTA PARA ATUALIZAR AGORA (Acessar pelo Navegador)
// ============================================================================
app.get('/api/script/atualizar-rastreios', async (req, res) => {
    
    // NOVIDADE: Este comando corrige os acentos (UTF-8) no navegador!
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    res.write("Iniciando verificação manual de rastreios (Lote máximo: 50 pedidos recentes)...\n\n");
    
    // Aumentamos o limite manual para 50 para varrer mais dados de uma vez
    const resultado = await processarRastreiosLogistica(50);
    
    res.write(`${resultado.mensagem}\n\n`);
    if (resultado.log && resultado.log.length > 0) {
        res.write("--- LOG DE ATIVIDADES DO ROBÔ ---\n");
        resultado.log.forEach(linha => res.write(`${linha}\n`));
    }
    res.end("\nScript finalizado.");
});

// ============================================================================
// 2. ROBÔ AUTOMÁTICO: CRON JOB DA VERCEL
// ============================================================================
app.get('/api/cron/verificar-entregas', async (req, res) => {
    console.log("🤖 Iniciando Cron Job de Rastreios...");
    // Mantemos 15 para garantir estabilidade automática
    const resultado = await processarRastreiosLogistica(15); 
    
    if (resultado.sucesso) {
        console.log("✅ Cron Job finalizado:", resultado.mensagem);
        res.status(200).json(resultado);
    } else {
        res.status(500).json(resultado);
    }
});

// ============================================================================
// 1. SCRIPT MANUAL: ROTA PARA ATUALIZAR AGORA (Acessar pelo Navegador)
// ============================================================================
app.get('/api/script/atualizar-rastreios', async (req, res) => {
    // Definimos um limite maior para o script manual, assumindo que você tem o navegador aberto a aguardar.
    res.write("Iniciando verificação manual de rastreios (Lote de 30 pedidos max)...\n\n");
    
    const resultado = await processarRastreiosLogistica(30);
    
    res.write(`${resultado.mensagem}\n\n`);
    if (resultado.log && resultado.log.length > 0) {
        res.write("--- DETALHES DO PROCESSAMENTO ---\n");
        resultado.log.forEach(linha => res.write(`${linha}\n`));
    }
    res.end("\nScript finalizado.");
});

// ============================================================================
// 2. ROBÔ AUTOMÁTICO: CRON JOB DA VERCEL
// ============================================================================
app.get('/api/cron/verificar-entregas', async (req, res) => {
    console.log("🤖 Iniciando Cron Job de Rastreios...");
    // Limite de 15 para garantir que a Vercel Hobby não cancele o processo (Timeout de 10s)
    const resultado = await processarRastreiosLogistica(15); 
    
    if (resultado.sucesso) {
        console.log("✅ Cron Job finalizado:", resultado.mensagem);
        res.status(200).json(resultado);
    } else {
        res.status(500).json(resultado);
    }
});

// ==========================================
// WEBHOOK E API: TINY ERP 
// ==========================================
app.post('/api/webhook/tiny', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) return res.status(200).send('OK');
        const dados = payload.dados;
        if (dados && dados.id && dados.cliente && dados.cliente.cpfCnpj) {
            await processarGrupoClienteTiny(dados.id, dados.cliente.cpfCnpj);
        }
        res.status(200).send('OK');
    } catch (erro) { res.status(200).send('OK'); }
});

async function processarGrupoClienteTiny(idPedido, cpfBruto) {
    const TOKEN = process.env.TINY_TOKEN;
    const cpfLimpo = cpfBruto.replace(/\D/g, '');
    if (!cpfLimpo) return;

    try {
        await delay(3000); 
        const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`;
        const respostaBusca = await fetch(urlBusca);
        const textoResposta = await respostaBusca.text();
        
        let dadosBusca;
        try { dadosBusca = JSON.parse(textoResposta); } catch (e) { return; }

        if (dadosBusca.retorno && dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
            const totalPedidos = dadosBusca.retorno.pedidos.length;
            const valorTotalGasto = dadosBusca.retorno.pedidos.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);
            const primeiroPedido = dadosBusca.retorno.pedidos[0].pedido;
            const nomeCliente = primeiroPedido.nome || 'Cliente Importado';

            await sql`
                INSERT INTO clientes (cpf, nome, cidade, estado, telefone, total_pedidos, valor_total)
                VALUES (${cpfLimpo}, ${nomeCliente}, '-', '-', '-', ${totalPedidos}, ${valorTotalGasto})
                ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome, total_pedidos = EXCLUDED.total_pedidos, valor_total = EXCLUDED.valor_total;
            `;

            let grupoReal = "SEM COMPRAS";
            if (totalPedidos === 1) grupoReal = "PRIMEIRA COMPRA";
            else if (totalPedidos > 1) {
                if (valorTotalGasto <= 1000) grupoReal = "BRONZE";
                else if (valorTotalGasto <= 3000) grupoReal = "PRATA";
                else if (valorTotalGasto <= 6000) grupoReal = "OURO";
                else grupoReal = "DIAMANTE";
            }

            const urlObterPedido = `https://api.tiny.com.br/api2/pedido.obter.php?token=${TOKEN}&id=${idPedido}&formato=JSON`;
            const respostaObter = await fetch(urlObterPedido);
            const jsonObter = await respostaObter.json();

            if (jsonObter.retorno && jsonObter.retorno.status === 'OK') {
                const obsAtual = jsonObter.retorno.pedido.obs_interna || '';
                if (obsAtual.includes('⭐ CLASSIFICAÇÃO: Cliente')) return; 
            }

            const obsInterna = `⭐ CLASSIFICAÇÃO: Cliente ${grupoReal} | Histórico: ${totalPedidos} pedidos | LTV: R$ ${valorTotalGasto.toFixed(2).replace('.', ',')}`;
            await atualizarObservacaoTiny(idPedido, obsInterna);
        }
    } catch (erro) {}
}

app.get('/api/relatorios/clientes', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows: clientesBI } = await sql`
            SELECT 
                c.cpf, c.nome, c.telefone, c.cidade, c.estado, COALESCE(c.total_pedidos, 0) AS total_pedidos, COALESCE(c.valor_total, 0) AS valor_total,
                AVG(EXTRACT(EPOCH FROM (p.data_entrega - p.data_envio)) / 86400) AS tempo_medio_entrega_dias
            FROM clientes c
            LEFT JOIN pedidos_nuvemshop p ON c.cpf = p.cpf_cliente AND p.data_entrega IS NOT NULL AND p.data_envio IS NOT NULL
            GROUP BY c.cpf, c.nome, c.telefone, c.cidade, c.estado, c.total_pedidos, c.valor_total
            ORDER BY c.valor_total DESC;
        `;

        const clientesProcessados = clientesBI.map(cliente => {
            const pedidos = parseInt(cliente.total_pedidos) || 0;
            const valor = parseFloat(cliente.valor_total) || 0;
            const ticket = pedidos > 0 ? (valor / pedidos) : 0;
            return {
                cpf: cliente.cpf, nome: cliente.nome, telefone: cliente.telefone, cidade: cliente.cidade, estado: cliente.estado,
                total_pedidos: pedidos, valor_total: valor, ticket_medio: ticket, tempo_medio_entrega_dias: Math.round(cliente.tempo_medio_entrega_dias || 0)
            };
        });
        res.json({ sucesso: true, clientes: clientesProcessados });
    } catch (erro) { res.status(500).json({ sucesso: false, erro: 'Erro interno ao cruzar dados.' }); }
});

app.post('/api/relatorios/sincronizar-contatos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const TOKEN = process.env.TINY_TOKEN;
    const paginaAtual = (req.body && req.body.pagina) ? req.body.pagina : 1; 
    let pagina = paginaAtual; let salvos = 0; let terminou = false;

    try {
        while (pagina < paginaAtual + 3) {
            const urlBusca = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resposta = await fetch(urlBusca);
            const dados = await resposta.json();
            
            if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.contatos) {
                const totalP = dados.retorno.numero_paginas;
                for (const item of dados.retorno.contatos) {
                    const c = item.contato;
                    const tipos = JSON.stringify(c.tipos_contato || '').toLowerCase();
                    if (tipos !== '""' && !tipos.includes('cliente')) continue; 
                    const cpfLimpo = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : null;
                    if (cpfLimpo) {
                        const tel = c.celular || c.fone || '-';
                        const email = c.email || ''; // 👈 CAPTURA DO E-MAIL AQUI TAMBÉM
                        await sql`
                            INSERT INTO clientes (cpf, nome, cidade, estado, telefone, email)
                            VALUES (${cpfLimpo}, ${c.nome}, ${c.cidade || '-'}, ${c.uf || '-'}, ${tel}, ${email})
                            ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome, telefone = EXCLUDED.telefone, email = EXCLUDED.email;
                        `;
                        salvos++;
                    }
                }
                if (pagina >= totalP) { terminou = true; break; }
                pagina++;
            } else { terminou = true; break; }
            await delay(500); 
        }
        res.json({ sucesso: true, proximaPagina: pagina, concluiu: terminou, salvosNesteLote: salvos });
    } catch (erro) { res.status(500).json({ sucesso: false, erro: 'Falha.' }); }
});

app.post('/api/relatorios/calcular-lote-financeiro', async (req, res) => {
    // Código inalterado...
    res.json({ sucesso: true });
});

// 5. SCRIPT PARA CAPTURAR EMAILS ANTIGOS DA TINY (Execução Manual via URL)
app.get('/api/script/capturar-emails', async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); // Força acentos corretos
    const TOKEN = process.env.TINY_TOKEN;
    let pagina = 1; let salvos = 0; let concluiu = false;
    res.write("Iniciando captura de e-mails antigos na base do Tiny...\n");

    try {
        while (!concluiu) {
            const urlBusca = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resposta = await fetch(urlBusca);
            const dados = await resposta.json();
            
            if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.contatos) {
                const totalP = dados.retorno.numero_paginas;
                for (const item of dados.retorno.contatos) {
                    const c = item.contato;
                    const cpfLimpo = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : null;
                    const email = c.email || '';
                    if (cpfLimpo && email !== '') {
                        // Atualiza silenciosamente a base de dados
                        await sql`UPDATE clientes SET email = ${email} WHERE cpf = ${cpfLimpo} AND (email IS NULL OR email = '');`;
                        salvos++;
                    }
                }
                if (pagina >= totalP) { concluiu = true; break; }
                pagina++;
            } else { concluiu = true; break; }
            await delay(1000); // Respeita a API do Tiny
        }
        res.end(`\nCaptura concluída com sucesso! ${salvos} e-mails atualizados.`);
    } catch (erro) { res.end(`\nFalha ao executar o script: ${erro.message}`); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta: ${PORT}`));
module.exports = app;