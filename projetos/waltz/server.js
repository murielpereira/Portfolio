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

// Serve a pasta 'public' onde estão seus arquivos HTML, CSS e JS
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar: Faz o servidor "dormir" por alguns milissegundos para não ser bloqueado
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ==========================================
// ROTA: VERIFICADOR DE SESSÃO
// ==========================================
app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.logado) {
        res.json({ logado: true });
    } else {
        res.json({ logado: false });
    }
});

// ==========================================
// ROTAS DE LOGIN E LOGOUT (Segurança Máxima via .env)
// ==========================================
app.post('/api/login', (req, res) => {
    const USUARIO_SECRETO = process.env.PAINEL_USUARIO;
    const SENHA_SECRETA = process.env.PAINEL_SENHA;

    if (!USUARIO_SECRETO || !SENHA_SECRETA) {
        console.error("❌ Faltam as variáveis de ambiente PAINEL_USUARIO ou PAINEL_SENHA.");
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
// ROTA: LER PEDIDOS NUVEMSHOP (Direto do Banco de Dados)
// ==========================================
app.get('/api/pedidos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });

    try {
        const { rows: pedidos } = await sql`
            SELECT * FROM pedidos_nuvemshop 
            WHERE status_nuvemshop != 'Cancelado'
            ORDER BY data_criacao DESC;
        `;
        res.json(pedidos);
    } catch (erro) {
        console.error("❌ Erro ao buscar pedidos no banco de dados:", erro);
        res.status(500).json({ erro: 'Erro interno ao carregar pedidos salvos.' });
    }
});

// ==========================================
// ROTA: MARCAR FEEDBACK WPP COMO ENVIADO
// ==========================================
app.post('/api/pedidos/marcar-feedback', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    
    try {
        const { id_pedido } = req.body;
        await sql`
            UPDATE pedidos_nuvemshop 
            SET status_feedback = 'Enviado' 
            WHERE id_pedido = ${id_pedido};
        `;
        res.json({ sucesso: true });
    } catch (erro) {
        console.error("❌ Erro ao atualizar feedback:", erro);
        res.status(500).json({ sucesso: false, erro: 'Falha no banco de dados.' });
    }
});

// Função Inteligente: Tenta buscar os dados até 3 vezes se a internet "piscar"
async function fetchComRetry(url, options, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            console.warn(`⚠️ Tentativa ${i+1} de comunicação com a Nuvemshop não retornou OK. Status: ${res.status}`);
        } catch (e) {
            console.warn(`⚠️ Tentativa ${i+1} falhou com erro de rede: ${e.message}`);
        }
        if (i < tentativas - 1) await delay(2000); // Espera 2 segundos antes de tentar de novo
    }
    throw new Error("Falha no fetch após 3 tentativas.");
}

// ==========================================
// WEBHOOK: NUVEMSHOP (Busca Inteligente, Filtro e Retry - Correção Vercel)
// ==========================================
app.post('/api/webhook/nuvemshop', async (req, res) => {
    const payload = req.body;
    
    // Se não tiver ID válido, encerra a conversa rapidamente
    if (!payload || !payload.id) {
        return res.status(200).send('Ignorado - Sem ID'); 
    }

    const idPedidoNuvem = payload.id;
    const evento = payload.event || req.headers['x-linked-store-event'] || 'Atualização';

    console.log(`\n🔔 NUVEMSHOP WEBHOOK: Evento [${evento}] para o ID ${idPedidoNuvem}. Buscando detalhes...`);

    try {
        const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
        const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;

        // Usa o sistema blindado de tentativas (Retry)
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
        const cidade = dadosPedido.shipping_address ? dadosPedido.shipping_address.city : '';
        const estado = dadosPedido.shipping_address ? dadosPedido.shipping_address.province : '';
        
        // 👇 AQUI ESTÁ A NOSSA NOVA VARIÁVEL: O CEP
        const cep_cliente = dadosPedido.shipping_address && dadosPedido.shipping_address.zipcode ? dadosPedido.shipping_address.zipcode : '';
        
        let transportadora = dadosPedido.shipping_option || '';
        transportadora = transportadora.replace(/via SmartEnvios/gi, '').trim();
        const rastreio = dadosPedido.shipping_tracking_number || '';
        
        // Variáveis Financeiras e de Entrega (As nossas variáveis de BI)
        const valor_total = parseFloat(dadosPedido.total || 0);
        const valor_frete = parseFloat(dadosPedido.shipping_cost_owner || dadosPedido.shipping_cost_customer || 0);

        // Regras de Status
        let status = 'Aberto';
        const statusPrincipal = (dadosPedido.status || '').toLowerCase();
        const statusPagamento = (dadosPedido.payment_status || '').toLowerCase();
        const statusEnvio = (dadosPedido.shipping_status || '').toLowerCase();

        if (statusPrincipal === 'closed') status = 'Arquivado';
        if (statusEnvio === 'delivered') status = 'Entregue';
        
        if (
            statusPrincipal === 'canceled' || statusPrincipal === 'cancelled' ||
            statusPagamento === 'canceled' || statusPagamento === 'voided' || statusPagamento === 'abandoned'
        ) {
            status = 'Cancelado';
        }

        // Regra do tempo de entrega pro BI (Marca o relógio quando for entregue)
        let data_entrega = null;
        if (status === 'Entregue' || status === 'Arquivado') { 
            data_entrega = new Date();
        }

        let listaProdutos = '';
        if (dadosPedido.products && Array.isArray(dadosPedido.products)) {
            listaProdutos = dadosPedido.products.map(item => `${item.quantity}x ${item.name}`).join(', ');
        }

        // Salva no Banco de Dados Postgres (COM CEP E VARIÁVEIS DE BI)
        await sql`
            INSERT INTO pedidos_nuvemshop (
                id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone,
                cidade, estado, transportadora, rastreio, status_nuvemshop, data_envio, produtos,
                valor_total, valor_frete, data_entrega, cep
            )
            VALUES (
                ${id_pedido}, ${numero_pedido}, ${data_criacao}, ${cliente}, ${cpf}, ${telefone},
                ${cidade}, ${estado}, ${transportadora}, ${rastreio}, ${status}, ${data_envio}, ${listaProdutos},
                ${valor_total}, ${valor_frete}, ${data_entrega}, ${cep_cliente}
            )
            ON CONFLICT (id_pedido) DO UPDATE SET 
                nome_cliente = EXCLUDED.nome_cliente,
                cpf_cliente = EXCLUDED.cpf_cliente,
                telefone = EXCLUDED.telefone,
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
        
        console.log(`✅ SUCESSO! Pedido #${numero_pedido} salvo! Status: ${status}`);
        
        // -------------------------------------------------------------
        // SOMENTE AQUI, DEPOIS DE TUDO PRONTO, LIBERAMOS A RESPOSTA!
        // -------------------------------------------------------------
        res.status(200).send('Processado e salvo com sucesso');

    } catch (erro) {
        console.error(`❌ Erro definitivo ao processar webhook Nuvemshop:`, erro.message);
        // Mesmo se der erro na lógica, respondemos OK para a Nuvemshop não ficar repetindo infinitamente
        res.status(200).send('Falha interna, mas recebido'); 
    }
});

// ==========================================
// ROBÔ DE RASTREAMENTO: SMARTENVIOS (Agendado via Vercel Cron)
// ==========================================
app.get('/api/cron/verificar-entregas', async (req, res) => {
    console.log("🤖 Iniciando verificação automática de rastreios (Cron Job da Madrugada)...");
    
    try {
        // Puxa os pedidos que estão em trânsito (Abertos) e que possuem rastreio
        const { rows: pedidosPendentes } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop
            WHERE rastreio IS NOT NULL 
              AND rastreio != '' 
              AND status_nuvemshop = 'Aberto';
        `;

        console.log(`🔎 Encontrados ${pedidosPendentes.length} pedidos em trânsito.`);

        let atualizados = 0;
        const TOKEN_SMART = process.env.SMARTENVIOS_TOKEN;
        const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
        const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
        const URL_API = "https://api.smartenvios.com/v1/freight-order/tracking";

        // Loop passando por cada pedido pendente
        for (const pedido of pedidosPendentes) {
            try {
                // 1. Pergunta o histórico à SmartEnvios
                const respostaSmart = await fetch(URL_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": TOKEN_SMART },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    const resultado = jsonSmart.result;

                    if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                        
                        // 2. A MÁGICA DO TEMPO: Ordena os eventos do mais antigo (coleta) para o mais novo (hoje)
                        const eventosOrdenados = resultado.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        
                        // Pega o status do último evento que aconteceu
                        const ultimoEvento = eventosOrdenados[eventosOrdenados.length - 1];
                        const statusAtual = ultimoEvento.code.tracking_type;

                        // SE FOI ENTREGUE FISICAMENTE...
                        if (statusAtual === 'DELIVERED') {
                            
                            // 3. Captura as datas reais da transportadora
                            const dataColetaReal = new Date(eventosOrdenados[0].date);
                            const dataEntregaReal = new Date(ultimoEvento.date);

                            // 4. Arquiva o pedido na Nuvemshop para encerrar o ciclo na plataforma deles
                            const respostaNuvem = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                                method: "PUT",
                                headers: { 
                                    'Authentication': `bearer ${TOKEN_NUVEM}`, 
                                    'Content-Type': 'application/json',
                                    'User-Agent': 'Waltz'
                                },
                                body: JSON.stringify({ status: "closed" })
                            });

                            if (!respostaNuvem.ok) {
                                console.error(`⚠️ Nuvemshop recusou o arquivamento do pedido #${pedido.numero_pedido}.`);
                            } else {
                                // 5. Atualiza o banco do Waltz com o status Arquivado E as datas precisas!
                                await sql`
                                    UPDATE pedidos_nuvemshop 
                                    SET status_nuvemshop = 'Arquivado',
                                        data_envio = ${dataColetaReal},
                                        data_entrega = ${dataEntregaReal}
                                    WHERE id_pedido = ${pedido.id_pedido};
                                `;
                                console.log(`📡 Sucesso! Pedido #${pedido.numero_pedido} arquivado. Coleta: ${dataColetaReal.toLocaleDateString()} | Entrega: ${dataEntregaReal.toLocaleDateString()}`);
                                atualizados++;
                            }
                        }
                    }
                }
            } catch (erroLoop) {
                console.error(`⚠️ Falha ao verificar rastreio do pedido #${pedido.numero_pedido}:`, erroLoop.message);
            }
            
            // Pausa de segurança de 1 segundo para não sobrecarregar as APIs (Rate Limit)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        res.json({ sucesso: true, mensagem: `Processo concluído. ${atualizados} pedidos entregues e arquivados com datas exatas.` });

    } catch (erro) {
        console.error("❌ Erro fatal no Robô de Rastreamento:", erro.message);
        res.status(500).json({ sucesso: false, erro: "Falha na verificação." });
    }
});

// ==========================================
// WEBHOOK: TINY ERP (Cria ou Atualiza Cliente)
// ==========================================
app.post('/api/webhook/tiny', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) return res.status(200).send('OK');

        const dados = payload.dados;
        if (dados && dados.id && dados.cliente && dados.cliente.cpfCnpj) {
            console.log(`\n📦 TINY WEBHOOK: Novo pedido ${dados.id} | CPF: ${dados.cliente.cpfCnpj}`);
            await processarGrupoClienteTiny(dados.id, dados.cliente.cpfCnpj);
        }
        res.status(200).send('OK');
    } catch (erro) {
        console.error("❌ Erro Webhook Tiny:", erro);
        res.status(200).send('OK'); 
    }
});

// ==========================================
// FUNÇÃO: PROCESSAR DADOS DO CLIENTE (TINY)
// ==========================================
async function processarGrupoClienteTiny(idPedido, cpfBruto) {
    const TOKEN = process.env.TINY_TOKEN;
    const cpfLimpo = cpfBruto.replace(/\D/g, '');

    if (!cpfLimpo) return;

    try {
        console.log(`⏳ Aguardando 3 segundos para o Tiny processar o pedido internamente...`);
        // Função delay deve estar definida no topo do seu server.js
        await delay(3000); 

        const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`;
        const respostaBusca = await fetch(urlBusca);
        const textoResposta = await respostaBusca.text();
        
        let dadosBusca;
        try {
            dadosBusca = JSON.parse(textoResposta);
        } catch (parseErro) {
            console.error(`⚠️ O Tiny não devolveu JSON. Resposta:`, textoResposta.substring(0, 300));
            return; 
        }

        if (dadosBusca.retorno && dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
            
            const totalPedidos = dadosBusca.retorno.pedidos.length;
            const valorTotalGasto = dadosBusca.retorno.pedidos.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);

            const primeiroPedido = dadosBusca.retorno.pedidos[0].pedido;
            const nomeCliente = primeiroPedido.nome || 'Cliente Importado';

            // 1. Atualiza o banco de dados local
            await sql`
                INSERT INTO clientes (cpf, nome, cidade, estado, telefone, total_pedidos, valor_total)
                VALUES (${cpfLimpo}, ${nomeCliente}, '-', '-', '-', ${totalPedidos}, ${valorTotalGasto})
                ON CONFLICT (cpf) DO UPDATE SET 
                    nome = EXCLUDED.nome,
                    total_pedidos = EXCLUDED.total_pedidos,
                    valor_total = EXCLUDED.valor_total;
            `;
            
            console.log(`✅ Cliente CPF ${cpfLimpo} atualizado! Pedidos totais: ${totalPedidos} | Valor: R$ ${valorTotalGasto}`);

            // --------------------------------------------------------
            // 2. NOVA LÓGICA: IDENTIFICAR O GRUPO E INJETAR OBSERVAÇÃO
            // --------------------------------------------------------
            let grupoReal = "SEM COMPRAS";
            if (totalPedidos === 1) {
                grupoReal = "PRIMEIRA COMPRA";
            } else if (totalPedidos > 1) {
                if (valorTotalGasto <= 1000) grupoReal = "BRONZE";
                else if (valorTotalGasto <= 3000) grupoReal = "PRATA";
                else if (valorTotalGasto <= 6000) grupoReal = "OURO";
                else grupoReal = "DIAMANTE";
            }

            // Monta as mensagens personalizadas
            const obsInterna = `⭐ CLASSIFICAÇÃO: Cliente ${grupoReal} | Histórico: ${totalPedidos} pedidos | LTV: R$ ${valorTotalGasto.toFixed(2).replace('.', ',')}`;
            let obsExterna = ``; 
            
            // Você pode customizar a mensagem externa que vai na nota do cliente
            if (grupoReal === "PRIMEIRA COMPRA") {
                obsExterna = `Bem-vindo(a) à Âme Acessórios Pet! Preparamos o seu primeiro pedido com muito carinho.`;
            } else {
                obsExterna = `Obrigado por escolher a Âme Acessórios Pet novamente! Você é um cliente categoria ${grupoReal}.`;
            }

            // Dispara a atualização para o Tiny ERP
            await atualizarObservacaoTiny(idPedido, obsExterna, obsInterna);

        } else if (dadosBusca.retorno && dadosBusca.retorno.status === 'Erro') {
            console.log(`⚠️ O Tiny retornou um aviso estruturado:`, dadosBusca.retorno.erros);
        }

    } catch (erro) {
        console.error("❌ Erro ao extrair dados na função do Webhook Tiny:", erro.message);
    }
}

// ==========================================
// ROTA: RELATÓRIO DE CLIENTES (BI - CRUZAMENTO DE DADOS CORRIGIDO)
// ==========================================
app.get('/api/relatorios/clientes', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });

    try {
        // 1. Puxamos a Fonte da Verdade do Tiny e cruzamos com a Nuvemshop apenas para o tempo de entrega
        const { rows: clientesBI } = await sql`
            SELECT 
                c.cpf, 
                c.nome, 
                c.telefone, 
                c.cidade, 
                c.estado,
                COALESCE(c.total_pedidos, 0) AS total_pedidos,
                COALESCE(c.valor_total, 0) AS valor_total,
                AVG(EXTRACT(EPOCH FROM (p.data_entrega - p.data_envio)) / 86400) AS tempo_medio_entrega_dias
            FROM clientes c
            LEFT JOIN pedidos_nuvemshop p 
                ON c.cpf = p.cpf_cliente 
                AND p.data_entrega IS NOT NULL 
                AND p.data_envio IS NOT NULL
            GROUP BY c.cpf, c.nome, c.telefone, c.cidade, c.estado, c.total_pedidos, c.valor_total
            ORDER BY c.valor_total DESC;
        `;

        // 2. Processamento em JavaScript (Calculando o Ticket Médio com segurança)
        const clientesProcessados = clientesBI.map(cliente => {
            const pedidos = parseInt(cliente.total_pedidos) || 0;
            const valor = parseFloat(cliente.valor_total) || 0;
            
            // Evita erro de divisão por zero caso o cliente tenha 0 pedidos
            const ticket = pedidos > 0 ? (valor / pedidos) : 0;

            return {
                cpf: cliente.cpf,
                nome: cliente.nome,
                telefone: cliente.telefone,
                cidade: cliente.cidade,
                estado: cliente.estado,
                total_pedidos: pedidos,
                valor_total: valor,
                ticket_medio: ticket,
                tempo_medio_entrega_dias: Math.round(cliente.tempo_medio_entrega_dias || 0)
            };
        });

        res.json({ sucesso: true, clientes: clientesProcessados });
    } catch (erro) {
        console.error("❌ Erro ao gerar BI de clientes:", erro);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao cruzar dados.' });
    }
});

// ROTA: SINCRONIZAÇÃO EM LOTES (Com filtro de "Apenas Clientes")
app.post('/api/relatorios/sincronizar-contatos', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const TOKEN = process.env.TINY_TOKEN;
    const paginaAtual = (req.body && req.body.pagina) ? req.body.pagina : 1; 
    const paginasPorLote = 3; 

    try {
        let pagina = paginaAtual;
        let salvosNesteLote = 0;
        let ignoradosNesteLote = 0;
        let totalPaginasTiny = 1;
        let terminou = false;

        while (pagina < paginaAtual + paginasPorLote) {
            const urlBusca = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resposta = await fetch(urlBusca);
            const textoResposta = await resposta.text();
            
            try {
                const dados = JSON.parse(textoResposta);

                if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.contatos) {
                    totalPaginasTiny = dados.retorno.numero_paginas;
                    
                    for (const item of dados.retorno.contatos) {
                        const c = item.contato;
                        const tiposDeContato = JSON.stringify(c.tipos_contato || '').toLowerCase();
                        
                        if (tiposDeContato !== '""' && !tiposDeContato.includes('cliente')) {
                            ignoradosNesteLote++;
                            continue; 
                        }

                        const cpfLimpo = c.cpf_cnpj ? c.cpf_cnpj.replace(/\D/g, '') : null;
                        
                        if (cpfLimpo) {
                            const telefone = c.celular || c.fone || '-';
                            await sql`
                                INSERT INTO clientes (cpf, nome, cidade, estado, telefone)
                                VALUES (${cpfLimpo}, ${c.nome}, ${c.cidade || '-'}, ${c.uf || '-'}, ${telefone})
                                ON CONFLICT (cpf) DO UPDATE SET 
                                    nome = EXCLUDED.nome,
                                    telefone = EXCLUDED.telefone;
                            `;
                            salvosNesteLote++;
                        }
                    }
                    if (pagina >= totalPaginasTiny) { terminou = true; break; }
                    pagina++;
                } else { 
                    terminou = true; break; 
                }
            } catch (parseErro) {
                console.error(`⚠️ Tiny bloqueou a leitura da página ${pagina}.`);
                terminou = true; break;
            }
            
            await delay(500); 
        }
        
        console.log(`Lote finalizado. Salvos: ${salvosNesteLote} | Ignorados: ${ignoradosNesteLote}`);
        res.json({ sucesso: true, proximaPagina: pagina, concluiu: terminou, salvosNesteLote });
        
    } catch (erro) { 
        console.error("Erro no lote de sincronização:", erro);
        res.status(500).json({ sucesso: false, erro: 'Falha no lote.' }); 
    }
});

// ROTA: CÁLCULO DE HISTÓRICO FINANCEIRO EM LOTE
app.post('/api/relatorios/calcular-lote-financeiro', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    const TOKEN = process.env.TINY_TOKEN;
    const cpfs = req.body.cpfs; 
    let atualizados = 0;

    try {
        for (const cpf of cpfs) {
            const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpf}&formato=JSON`;
            const resposta = await fetch(urlBusca);
            const textoResposta = await resposta.text();
            
            try {
                const dados = JSON.parse(textoResposta);

                if (dados.retorno && dados.retorno.status === 'OK' && dados.retorno.pedidos) {
                    const totalPedidos = dados.retorno.pedidos.length;
                    const valorTotalGasto = dados.retorno.pedidos.reduce((acumulador, p) => acumulador + parseFloat(p.pedido.valor || 0), 0);

                    const infoCliente = dados.retorno.pedidos[0].pedido.cliente;
                    const nome = infoCliente.nome || 'Cliente Importado';
                    const cidade = infoCliente.cidade || '-';
                    const uf = infoCliente.uf || '-';
                    const telefone = infoCliente.fone || infoCliente.celular || '-';

                    await sql`
                        INSERT INTO clientes (cpf, nome, cidade, estado, telefone, total_pedidos, valor_total)
                        VALUES (${cpf}, ${nome}, ${cidade}, ${uf}, ${telefone}, ${totalPedidos}, ${valorTotalGasto})
                        ON CONFLICT (cpf) DO UPDATE SET 
                            nome = EXCLUDED.nome,
                            cidade = EXCLUDED.cidade,
                            estado = EXCLUDED.estado,
                            telefone = EXCLUDED.telefone,
                            total_pedidos = EXCLUDED.total_pedidos,
                            valor_total = EXCLUDED.valor_total;
                    `;
                    atualizados++;
                }
            } catch (e) {
                console.error(`⚠️ Tiny retornou erro de leitura para o CPF ${cpf}.`);
            }

            await delay(1000); // Respeito ao Rate Limit do Tiny ERP
        }
        
        res.json({ sucesso: true, atualizados });
    } catch (erro) {
        console.error("Erro interno no servidor durante o cálculo:", erro);
        res.status(500).json({ sucesso: false, erro: 'Falha no servidor.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta: ${PORT}`));
module.exports = app;

// ==========================================
// FUNÇÃO: ATUALIZAR OBSERVAÇÕES NO TINY ERP
// ==========================================
async function atualizarObservacaoTiny(idPedidoTiny, observacaoExterna, observacaoInterna) {
    console.log(`\n📝 TINY API: Escrevendo observações no pedido ID: ${idPedidoTiny}`);
    
    const TOKEN = process.env.TINY_TOKEN;
    const urlTiny = `https://erp.tiny.com.br/api2/pedido.alterar.php?token=${TOKEN}&id=${idPedidoTiny}&formato=JSON`;
    
    // Constrói a string JSON pura exatamente como no comando cURL do suporte
    const corpoRaw = JSON.stringify({
        "dados_pedido": {
            "obs": observacaoExterna,
            "obs_interna": observacaoInterna
        }
    });

    try {
        const resposta = await fetch(urlTiny, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: corpoRaw // Passa a string crua sem converter para URLSearchParams
        });

        const dadosJson = await resposta.json();

        if (dadosJson.retorno && dadosJson.retorno.status === 'OK') {
            console.log(`✅ Observações injetadas com sucesso no pedido ${idPedidoTiny}!`);
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