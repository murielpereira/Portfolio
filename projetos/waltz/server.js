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
        
        let transportadora = dadosPedido.shipping_option || '';
        transportadora = transportadora.replace(/via SmartEnvios/gi, '').trim();
        const rastreio = dadosPedido.shipping_tracking_number || '';
        
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

        let listaProdutos = '';
        if (dadosPedido.products && Array.isArray(dadosPedido.products)) {
            listaProdutos = dadosPedido.products.map(item => `${item.quantity}x ${item.name}`).join(', ');
        }

        // Salva no Banco de Dados Postgres
        await sql`
            INSERT INTO pedidos_nuvemshop (
                id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone,
                cidade, estado, transportadora, rastreio, status_nuvemshop, data_envio, produtos
            )
            VALUES (
                ${id_pedido}, ${numero_pedido}, ${data_criacao}, ${cliente}, ${cpf}, ${telefone},
                ${cidade}, ${estado}, ${transportadora}, ${rastreio}, ${status}, ${data_envio}, ${listaProdutos}
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
                produtos = EXCLUDED.produtos;
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

                    if (resultado && resultado.trackings && resultado.trackings.length > 0) {
                        const eventos = resultado.trackings.sort((a, b) => new Date(b.date) - new Date(a.date));
                        const statusAtual = eventos[0].code.tracking_type;

                        if (statusAtual === 'DELIVERED') {
                            
                            const respostaNuvem = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${pedido.id_pedido}`, {
                                method: "PUT",
                                headers: { 
                                    'Authentication': `bearer ${TOKEN_NUVEM}`, 
                                    'Content-Type': 'application/json',
                                    'User-Agent': 'Waltz'
                                },
                                body: JSON.stringify({ shipping_status: "delivered" })
                            });

                            if (!respostaNuvem.ok) {
                                console.error(`⚠️ Nuvemshop recusou pedido #${pedido.numero_pedido}.`);
                            } else {
                                console.log(`📡 Solicitação enviada à Nuvemshop (Pedido #${pedido.numero_pedido}).`);
                                atualizados++;
                            }
                            // ❌ Banco de dados local intocado! O Webhook assume daqui.
                        }
                    }
                }
            } catch (erroLoop) {
                console.error(`⚠️ Falha ao verificar rastreio do pedido #${pedido.numero_pedido}:`, erroLoop.message);
            }
            await delay(1000);
        }

        res.json({ sucesso: true, mensagem: `Processo concluído. ${atualizados} pedidos notificados à Nuvemshop.` });

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
        await delay(3000);

        const urlBusca = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`;
        const respostaBusca = await fetch(urlBusca);
        const textoResposta = await respostaBusca.text();
        
        let dadosBusca;
        
        // 1. Bloco Isolado: Tenta apenas converter o JSON
        try {
            dadosBusca = JSON.parse(textoResposta);
        } catch (parseErro) {
            console.error(`⚠️ O Tiny não devolveu JSON. Resposta:`, textoResposta.substring(0, 300));
            return; // Para a execução aqui se não for JSON
        }

        // 2. Se chegou aqui, é um JSON válido. Vamos processar com segurança!
        if (dadosBusca.retorno && dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
            
            // Calcula o Lifetime Value (LTV)
            const totalPedidos = dadosBusca.retorno.pedidos.length;
            const valorTotalGasto = dadosBusca.retorno.pedidos.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);

            // Extração Correta e Segura: O nome está direto dentro de "pedido"
            const primeiroPedido = dadosBusca.retorno.pedidos[0].pedido;
            const nomeCliente = primeiroPedido.nome || 'Cliente Importado';

            // 3. Atualiza o banco de forma cirúrgica (Não apaga o endereço que já existe)
            await sql`
                INSERT INTO clientes (cpf, nome, cidade, estado, telefone, total_pedidos, valor_total)
                VALUES (${cpfLimpo}, ${nomeCliente}, '-', '-', '-', ${totalPedidos}, ${valorTotalGasto})
                ON CONFLICT (cpf) DO UPDATE SET 
                    nome = EXCLUDED.nome,
                    total_pedidos = EXCLUDED.total_pedidos,
                    valor_total = EXCLUDED.valor_total;
            `;
            
            console.log(`✅ Cliente CPF ${cpfLimpo} atualizado via Webhook! Pedidos totais: ${totalPedidos} | Valor: R$ ${valorTotalGasto}`);
        } else if (dadosBusca.retorno && dadosBusca.retorno.status === 'Erro') {
            console.log(`⚠️ O Tiny retornou um aviso estruturado:`, dadosBusca.retorno.erros);
        }

    } catch (erro) {
        // Agora, se der qualquer outro erro na nossa lógica de leitura, ele cai aqui, apontando o motivo real!
        console.error("❌ Erro ao extrair dados na função do Webhook Tiny:", erro.message);
    }
}

// ==========================================
// ROTA: RELATÓRIO DE CLIENTES (BI - CRUZAMENTO DE DADOS)
// ==========================================
app.get('/api/relatorios/clientes', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });

    try {
        // 1. A Mágica do SQL Relacional (JOIN) e Agrupamento (GROUP BY)
        const { rows: clientesBI } = await sql`
            SELECT 
                c.cpf, 
                c.nome, 
                c.telefone, 
                c.cidade, 
                c.estado,
                COUNT(p.id_pedido) AS total_pedidos,
                COALESCE(SUM(p.valor_total), 0) AS valor_total,
                COALESCE(AVG(p.valor_total), 0) AS ticket_medio,
                COALESCE(AVG(p.valor_frete), 0) AS frete_medio,
                AVG(EXTRACT(EPOCH FROM (p.data_entrega - p.data_criacao)) / 86400) AS tempo_medio_entrega_dias,
                STRING_AGG(p.produtos, ' || ') AS todos_produtos
            FROM clientes c
            LEFT JOIN pedidos_nuvemshop p 
                ON c.cpf = p.cpf_cliente AND p.status_nuvemshop != 'Cancelado'
            GROUP BY c.cpf, c.nome, c.telefone, c.cidade, c.estado
            ORDER BY valor_total DESC;
        `;

        // 2. Processamento em JavaScript para a Quantidade de Produtos
        const clientesProcessados = clientesBI.map(cliente => {
            let totalItensComprados = 0;
            
            // Lendo o texto de produtos (ex: "2x Guia || 1x Coleira")
            if (cliente.todos_produtos) {
                // Separa o texto toda vez que achar uma vírgula ou "||"
                const partes = cliente.todos_produtos.split(/[,||]+/); 
                
                partes.forEach(parte => {
                    const textoLimpo = parte.trim();
                    // Regex: Procura qualquer número (\d+) que esteja colado num "x"
                    const match = textoLimpo.match(/^(\d+)x/); 
                    if (match) {
                        totalItensComprados += parseInt(match[1], 10);
                    }
                });
            }

            // Calcula a média de produtos por compra
            const mediaProdutos = cliente.total_pedidos > 0 ? (totalItensComprados / cliente.total_pedidos).toFixed(1) : 0;

            // 3. Monta o "Pacote Final" para enviar ao Front-end
            return {
                cpf: cliente.cpf,
                nome: cliente.nome,
                telefone: cliente.telefone,
                cidade: cliente.cidade,
                estado: cliente.estado,
                total_pedidos: parseInt(cliente.total_pedidos),
                valor_total: parseFloat(cliente.valor_total),
                ticket_medio: parseFloat(cliente.ticket_medio),
                frete_medio: parseFloat(cliente.frete_medio),
                tempo_medio_entrega_dias: Math.round(cliente.tempo_medio_entrega_dias || 0), // Arredonda para dias inteiros
                media_produtos_por_compra: parseFloat(mediaProdutos)
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