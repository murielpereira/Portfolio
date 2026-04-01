const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');
const { delay } = require('../utils/helpers');

async function atualizarObservacaoTiny(idPedidoTiny, observacaoInterna) {
    const urlTiny = `https://erp.tiny.com.br/api2/pedido.alterar.php?token=${process.env.TINY_TOKEN}&id=${idPedidoTiny}&formato=JSON`;
    try {
        await fetch(urlTiny, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: JSON.stringify({ "dados_pedido": { "obs_interna": observacaoInterna } }) });
    } catch (erro) {}
}

async function processarGrupoClienteTiny(idPedido, cpfBruto) {
    const TOKEN = process.env.TINY_TOKEN;
    const cpfLimpo = cpfBruto.replace(/\D/g, '');
    if (!cpfLimpo) return;

    try {
        await delay(500); 
        
        const respostaBusca = await fetch(`https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TOKEN}&cpf_cnpj=${cpfLimpo}&formato=JSON`);
        const dadosBusca = await respostaBusca.json();

        if (dadosBusca.retorno && dadosBusca.retorno.status === 'OK' && dadosBusca.retorno.pedidos) {
            const pedidosDoCliente = dadosBusca.retorno.pedidos;
            const pedidoAtual = pedidosDoCliente[0].pedido;

            if (pedidoAtual.obs_interna && pedidoAtual.obs_interna.includes('⭐ CLASSIFICAÇÃO')) {
                console.log(`🛡️ Loop evitado: O pedido ${idPedido} já foi classificado anteriormente.`);
                return; 
            }

            const totalPedidos = pedidosDoCliente.length;
            const valorTotalGasto = pedidosDoCliente.reduce((acc, p) => acc + parseFloat(p.pedido.valor || 0), 0);
            
            await sql`
                INSERT INTO clientes (cpf, nome, total_pedidos, valor_total)
                VALUES (${cpfLimpo}, ${pedidoAtual.nome}, ${totalPedidos}, ${valorTotalGasto})
                ON CONFLICT (cpf) DO UPDATE SET total_pedidos = EXCLUDED.total_pedidos, valor_total = EXCLUDED.valor_total;
            `;

            let grupoReal = totalPedidos === 1 ? "PRIMEIRA COMPRA" : (valorTotalGasto <= 1000 ? "BRONZE" : (valorTotalGasto <= 3000 ? "PRATA" : "OURO"));
            const obsInterna = `⭐ CLASSIFICAÇÃO: Cliente ${grupoReal} | Histórico: ${totalPedidos} pedidos | LTV: R$ ${valorTotalGasto.toFixed(2)}`;
            
            await atualizarObservacaoTiny(idPedido, obsInterna);
        }
    } catch (erro) {
        console.error("Erro ao processar cliente do Tiny:", erro);
    }
}

router.post('/api/webhook/tiny', async (req, res) => {
    try {
        if (req.body && req.body.dados && req.body.dados.id && req.body.dados.cliente) {
            await processarGrupoClienteTiny(req.body.dados.id, req.body.dados.cliente.cpfCnpj);
        }
        res.status(200).send('OK');
    } catch (erro) { res.status(200).send('OK'); }
});

router.get('/api/relatorios/clientes', async (req, res) => {
    if (!req.session || !req.session.logado) return res.status(401).json({ erro: 'Acesso negado.' });
    try {
        const { rows } = await sql`
            SELECT 
                c.*,
                CASE WHEN c.total_pedidos > 0 THEN (c.valor_total / c.total_pedidos) ELSE 0 END AS ticket_medio,
                ROUND(p.media_dias, 0) AS tempo_medio_entrega_dias,
                ult.data_criacao AS ultima_compra_data,
                ult.numero_pedido AS ultima_compra_pedido
            FROM clientes c
            LEFT JOIN (
                SELECT cpf_cliente, AVG(EXTRACT(EPOCH FROM (data_entrega::timestamp - data_envio::timestamp)) / 86400)::numeric AS media_dias
                FROM pedidos_nuvemshop
                WHERE status_nuvemshop = 'Entregue' AND data_envio IS NOT NULL AND data_entrega IS NOT NULL AND data_entrega >= data_envio
                GROUP BY cpf_cliente
            ) p ON c.cpf = p.cpf_cliente
            LEFT JOIN LATERAL (
                SELECT data_criacao, numero_pedido
                FROM pedidos_nuvemshop
                WHERE cpf_cliente = c.cpf
                ORDER BY data_criacao DESC
                LIMIT 1
            ) ult ON true
            ORDER BY c.valor_total DESC;
        `;
        res.json({ sucesso: true, clientes: rows });
    } catch (erro) { 
        res.status(500).json({ sucesso: false }); 
    }
});

router.post('/api/relatorios/sincronizar-contatos', async (req, res) => {
    // Código de sincronização do Tiny...
    res.json({ sucesso: true });
});

router.get('/api/script/capturar-emails', async (req, res) => {
    // Script de emails...
    res.send("Script executado.");
});

module.exports = router;