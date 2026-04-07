const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');
const { fetchComRetry } = require('../utils/helpers');

const pedidosEmProcessamentoNuvem = new Set();

// ============================================================================
// ROTAS DE CONSULTA, PAINEL E ENTREGAS
// ============================================================================
router.get('/api/pedidos', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows: pedidos } = await sql`SELECT * FROM pedidos_nuvemshop ORDER BY data_criacao DESC LIMIT 1500;`;
        res.json(pedidos);
    } catch (erro) { res.status(500).json({ erro: 'Erro interno' }); }
});

router.get('/api/relatorios/logistica', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        // FIX: Usando NULLIF para ignorar fretes zerados (Frete Grátis) da média
        const { rows } = await sql`
            SELECT 
                LEFT(REPLACE(cep, '-', ''), 5) AS cep_prefixo,
                COUNT(id_pedido)::int AS volume,
                COUNT(NULLIF(valor_frete, 0))::int AS volume_frete_pago,
                ROUND(AVG(EXTRACT(EPOCH FROM (data_entrega::timestamp - data_envio::timestamp)) / 86400), 0)::int AS media_dias,
                ROUND(AVG(NULLIF(valor_frete, 0)), 2)::numeric AS media_frete
            FROM pedidos_nuvemshop
            WHERE status_nuvemshop IN ('Entregue', 'Arquivado', 'CLOSED', 'DELIVERED') 
              AND cep IS NOT NULL AND cep != ''
              AND data_envio IS NOT NULL AND data_entrega IS NOT NULL AND data_entrega >= data_envio
              AND EXTRACT(EPOCH FROM (data_entrega::timestamp - data_envio::timestamp)) / 86400 <= 60
            GROUP BY LEFT(REPLACE(cep, '-', ''), 5)
            ORDER BY volume DESC;
        `;
        res.json({ sucesso: true, dados: rows });
    } catch (erro) { 
        console.error("Erro na rota logística:", erro);
        res.status(500).json({ sucesso: false }); 
    }
});

router.get('/api/relatorios/entregas', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        // Consulta GERAL (Gráfico de Pizza e Tabela Principal)
        const geral = await sql`
            SELECT 
                CASE 
                    WHEN transportadora ILIKE '%jadlog%' THEN 'Jadlog'
                    WHEN transportadora ILIKE '%sedex%' THEN 'Correios (SEDEX)'
                    WHEN transportadora ILIKE '%pac%' THEN 'Correios (PAC)'
                    WHEN transportadora ILIKE '%mini%' THEN 'Correios (Mini)'
                    WHEN transportadora ILIKE '%j&t%' OR transportadora ILIKE '%j t%' THEN 'J&T Express'
                    WHEN transportadora ILIKE '%loggi%' THEN 'Loggi'
                    WHEN transportadora ILIKE '%gfl%' THEN 'GFL'
                    WHEN transportadora ILIKE '%gollog%' THEN 'GolLog'
                    ELSE transportadora 
                END AS transportadora, 
                COUNT(id_pedido)::int AS envios, 
                ROUND(AVG(NULLIF(valor_frete, 0)), 2)::numeric AS media_frete, 
                ROUND(AVG(EXTRACT(EPOCH FROM (data_entrega::timestamp - data_envio::timestamp)) / 86400), 1)::numeric AS media_dias
            FROM pedidos_nuvemshop 
            WHERE transportadora IS NOT NULL AND transportadora != ''
              -- LISTA NEGRA: Remove lixos e nomes genéricos
              AND transportadora NOT ILIKE '%Brazilian Post Office%'
              AND transportadora NOT ILIKE '%Custo e prazo de entrega padrão%'
              AND transportadora NOT ILIKE '%Econômico%'
              AND transportadora NOT ILIKE '%Entraremos em contato com você%'
              AND transportadora NOT ILIKE '%Expresso%'
            GROUP BY 
                CASE 
                    WHEN transportadora ILIKE '%jadlog%' THEN 'Jadlog'
                    WHEN transportadora ILIKE '%sedex%' THEN 'Correios (SEDEX)'
                    WHEN transportadora ILIKE '%pac%' THEN 'Correios (PAC)'
                    WHEN transportadora ILIKE '%mini%' THEN 'Correios (Mini)'
                    WHEN transportadora ILIKE '%j&t%' OR transportadora ILIKE '%j t%' THEN 'J&T Express'
                    WHEN transportadora ILIKE '%loggi%' THEN 'Loggi'
                    WHEN transportadora ILIKE '%gfl%' THEN 'GFL'
                    WHEN transportadora ILIKE '%gollog%' THEN 'GolLog'
                    ELSE transportadora 
                END
            ORDER BY envios DESC;
        `;

        // Consulta por ESTADOS (Tabela Inferior)
        const estados = await sql`
            SELECT 
                estado, 
                CASE 
                    WHEN transportadora ILIKE '%jadlog%' THEN 'Jadlog'
                    WHEN transportadora ILIKE '%sedex%' THEN 'Correios (SEDEX)'
                    WHEN transportadora ILIKE '%pac%' THEN 'Correios (PAC)'
                    WHEN transportadora ILIKE '%mini%' THEN 'Correios (Mini)'
                    WHEN transportadora ILIKE '%j&t%' OR transportadora ILIKE '%j t%' THEN 'J&T Express'
                    WHEN transportadora ILIKE '%loggi%' THEN 'Loggi'
                    WHEN transportadora ILIKE '%gfl%' THEN 'GFL'
                    WHEN transportadora ILIKE '%gollog%' THEN 'GolLog'
                    ELSE transportadora 
                END AS transportadora, 
                COUNT(id_pedido)::int AS envios, 
                ROUND(AVG(EXTRACT(EPOCH FROM (data_entrega::timestamp - data_envio::timestamp)) / 86400), 1)::numeric AS media_dias
            FROM pedidos_nuvemshop 
            WHERE estado IS NOT NULL AND estado != '' AND transportadora IS NOT NULL AND transportadora != '' AND data_entrega IS NOT NULL AND data_envio IS NOT NULL
              -- LISTA NEGRA: Remove lixos e nomes genéricos
              AND transportadora NOT ILIKE '%Brazilian Post Office%'
              AND transportadora NOT ILIKE '%Custo e prazo de entrega padrão%'
              AND transportadora NOT ILIKE '%Econômico%'
              AND transportadora NOT ILIKE '%Entraremos em contato com você%'
              AND transportadora NOT ILIKE '%Expresso%'
            GROUP BY 
                estado, 
                CASE 
                    WHEN transportadora ILIKE '%jadlog%' THEN 'Jadlog'
                    WHEN transportadora ILIKE '%sedex%' THEN 'Correios (SEDEX)'
                    WHEN transportadora ILIKE '%pac%' THEN 'Correios (PAC)'
                    WHEN transportadora ILIKE '%mini%' THEN 'Correios (Mini)'
                    WHEN transportadora ILIKE '%j&t%' OR transportadora ILIKE '%j t%' THEN 'J&T Express'
                    WHEN transportadora ILIKE '%loggi%' THEN 'Loggi'
                    WHEN transportadora ILIKE '%gfl%' THEN 'GFL'
                    WHEN transportadora ILIKE '%gollog%' THEN 'GolLog'
                    ELSE transportadora 
                END
            ORDER BY estado ASC, envios DESC;
        `;
        
        res.json({ sucesso: true, geral: geral.rows, estados: estados.rows });
    } catch (erro) { 
        console.error("Erro na rota de entregas:", erro);
        res.status(500).json({ sucesso: false }); 
    }
});

router.post('/api/pedidos/marcar-feedback', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { id_pedido } = req.body;
        await sql`UPDATE pedidos_nuvemshop SET status_feedback = 'Enviado' WHERE id_pedido = ${id_pedido};`;
        res.json({ sucesso: true });
    } catch (erro) { res.status(500).json({ sucesso: false }); }
});

// ============================================================================
// O WEBHOOK INTELIGENTE (À PROVA DE BUGS DA NUVEMSHOP)
// ============================================================================
router.post('/api/webhook/nuvemshop', async (req, res) => {
    const payload = req.body;
    if (!payload || !payload.id) return res.status(200).send('Ignorado'); 

    const idPedidoNuvem = payload.id.toString();
    if (pedidosEmProcessamentoNuvem.has(idPedidoNuvem)) return res.status(200).send('Eco ignorado'); 

    pedidosEmProcessamentoNuvem.add(idPedidoNuvem);
    setTimeout(() => { pedidosEmProcessamentoNuvem.delete(idPedidoNuvem); }, 10000); 

    try {
        const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
        const ACCESS_TOKEN = process.env.NUVEMSHOP_TOKEN;
        const resposta = await fetchComRetry(`https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${idPedidoNuvem}`, { headers: { 'Authentication': `bearer ${ACCESS_TOKEN}`, 'User-Agent': 'Waltz' } });
        const dadosPedido = await resposta.json();

        const cliente = dadosPedido.customer ? dadosPedido.customer.name : 'Desconhecido';
        const cpf = dadosPedido.customer && dadosPedido.customer.identification ? dadosPedido.customer.identification.replace(/\D/g, '') : '';
        const email_cliente = dadosPedido.customer && dadosPedido.customer.email ? dadosPedido.customer.email : '';
        const telefone = dadosPedido.customer && dadosPedido.customer.phone ? dadosPedido.customer.phone : '';
        
        // FIX: Usar ' || ' em vez de vírgula para não fatiar os produtos erradamente
        const nomesProdutos = dadosPedido.products ? dadosPedido.products.map(p => p.name).join(' || ') : '';
        
        // FIX: Captura de Endereço, Transportadora e Custo
        const cidade = dadosPedido.shipping_address ? dadosPedido.shipping_address.city : '';
        const estado = dadosPedido.shipping_address ? dadosPedido.shipping_address.province : '';
        const transportadora = dadosPedido.shipping_option || '';
        const valor_frete = dadosPedido.shipping_cost || 0;

        let status = 'Aberto';
        const statusPrincipal = (dadosPedido.status || '').toLowerCase();
        const statusEnvio = (dadosPedido.shipping_status || '').toLowerCase();

        if (statusPrincipal === 'closed' || statusEnvio === 'delivered') status = 'Entregue';
        else if (statusEnvio === 'shipped') status = 'Enviado'; 
        if (statusPrincipal === 'canceled') status = 'Cancelado';

        const rastreio = dadosPedido.shipping_tracking_number || '';
        
        // ==============================================================
        // LÓGICA DE CRUZAMENTO DE DATAS (O Cérebro da Automação)
        // ==============================================================
        let dataEnvioFinal = dadosPedido.shipped_at ? new Date(dadosPedido.shipped_at) : null;
        let dataEntregaFinal = null;
        let dataEnvioBackupSmart = null;

        if (rastreio && process.env.SMARTENVIOS_TOKEN) {
            try {
                const respostaSmart = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "token": process.env.SMARTENVIOS_TOKEN },
                    body: JSON.stringify({ "tracking_code": rastreio })
                });

                if (respostaSmart.ok) {
                    const jsonSmart = await respostaSmart.json();
                    if (jsonSmart.result && jsonSmart.result.trackings && jsonSmart.result.trackings.length > 0) {
                        const eventos = jsonSmart.result.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));

                        const eventoEntrega = eventos.find(e => e.code && e.code.tracking_type === 'DELIVERED');
                        if (eventoEntrega) {
                            dataEntregaFinal = new Date(eventoEntrega.date);
                        }

                        const bipeFisico = eventos.find(e => 
                            e.code &&
                            e.code.tracking_type !== 'CREATED' && 
                            e.code.tracking_type !== 'REGISTERED' &&
                            !(e.message && e.message.toLowerCase().includes("criado"))
                        );

                        if (bipeFisico) {
                            dataEnvioBackupSmart = new Date(bipeFisico.date);
                        }
                    }
                }
            } catch (err) { 
                console.error("⚠️ Falha ao buscar dados na SmartEnvios via Webhook"); 
            }
        }

        // 🛡️ O ESCUDO JS - Ativa se a Nuvemshop mandar uma data de envio MAIOR ou IGUAL à data de entrega
        if (!dataEnvioFinal || 
            (dataEntregaFinal && dataEnvioFinal >= dataEntregaFinal) || 
            (dataEntregaFinal && dataEnvioFinal.toISOString().substring(0,10) === dataEntregaFinal.toISOString().substring(0,10))
        ) {
            if (dataEnvioBackupSmart) {
                dataEnvioFinal = dataEnvioBackupSmart;
            }
        }

        if (!dataEnvioFinal && (status === 'Enviado' || status === 'Entregue')) {
            dataEnvioFinal = new Date(dadosPedido.created_at);
        }
        if (status === 'Entregue' && !dataEntregaFinal) {
            dataEntregaFinal = dadosPedido.finished_at ? new Date(dadosPedido.finished_at) : new Date(dadosPedido.updated_at);
        }

        // ==============================================================
        // 🛡️ A MURALHA DE AÇO E NOVAS COLUNAS
        // ==============================================================
        try { await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS produtos TEXT;`; } catch(e) {}
        try { await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS cidade VARCHAR(150);`; } catch(e) {}
        try { await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS estado VARCHAR(100);`; } catch(e) {}
        try { await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS transportadora VARCHAR(150);`; } catch(e) {}
        try { await sql`ALTER TABLE pedidos_nuvemshop ADD COLUMN IF NOT EXISTS valor_frete NUMERIC;`; } catch(e) {}

        const envioDB = dataEnvioFinal ? dataEnvioFinal.toISOString() : null;
        const entregaDB = dataEntregaFinal ? dataEntregaFinal.toISOString() : null;

        await sql`
            INSERT INTO pedidos_nuvemshop (
                id_pedido, numero_pedido, data_criacao, nome_cliente, cpf_cliente, telefone, email_cliente,
                status_nuvemshop, rastreio, cep, data_envio, data_entrega, produtos, cidade, estado, transportadora, valor_frete
            )
            VALUES (
                ${dadosPedido.id}, ${dadosPedido.number}, ${new Date(dadosPedido.created_at).toISOString()}, ${cliente}, ${cpf}, ${telefone}, ${email_cliente},
                ${status}, ${rastreio}, ${dadosPedido.shipping_address ? dadosPedido.shipping_address.zipcode : ''},
                ${envioDB}, ${entregaDB}, ${nomesProdutos}, ${cidade}, ${estado}, ${transportadora}, ${valor_frete}
            )
            ON CONFLICT (id_pedido) DO UPDATE SET 
                status_nuvemshop = EXCLUDED.status_nuvemshop,
                rastreio = EXCLUDED.rastreio,
                produtos = CASE WHEN EXCLUDED.produtos IS NOT NULL AND EXCLUDED.produtos != '' THEN EXCLUDED.produtos ELSE pedidos_nuvemshop.produtos END,
                cidade = CASE WHEN EXCLUDED.cidade IS NOT NULL AND EXCLUDED.cidade != '' THEN EXCLUDED.cidade ELSE pedidos_nuvemshop.cidade END,
                estado = CASE WHEN EXCLUDED.estado IS NOT NULL AND EXCLUDED.estado != '' THEN EXCLUDED.estado ELSE pedidos_nuvemshop.estado END,
                transportadora = CASE WHEN EXCLUDED.transportadora IS NOT NULL AND EXCLUDED.transportadora != '' THEN EXCLUDED.transportadora ELSE pedidos_nuvemshop.transportadora END,
                valor_frete = EXCLUDED.valor_frete,
                -- REGRA DE OURO LOGÍSTICA:
                data_envio = CASE 
                    WHEN pedidos_nuvemshop.data_envio IS NULL THEN EXCLUDED.data_envio
                    WHEN EXCLUDED.data_envio IS NOT NULL AND EXCLUDED.data_envio < pedidos_nuvemshop.data_envio THEN EXCLUDED.data_envio
                    ELSE pedidos_nuvemshop.data_envio
                END,
                data_entrega = CASE 
                    WHEN pedidos_nuvemshop.data_entrega IS NULL THEN EXCLUDED.data_entrega
                    WHEN EXCLUDED.data_entrega IS NOT NULL AND EXCLUDED.data_entrega < pedidos_nuvemshop.data_entrega THEN EXCLUDED.data_entrega
                    ELSE pedidos_nuvemshop.data_entrega
                END;
        `;
        res.status(200).send('Processado e salvo com sucesso');
    } catch (erro) { res.status(200).send('Falha interna'); }
});

module.exports = router;