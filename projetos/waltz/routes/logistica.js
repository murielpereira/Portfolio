const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');
const { delay } = require('../utils/helpers');

async function processarRastreiosLogistica(limite = 20) {
    let atualizados = 0;
    try {
        // 1. MUDANÇA CRÍTICA AQUI: O robô agora procura pedidos com rastreio, 
        // mas que AINDA NÃO TEM a data de entrega preenchida.
        // Ele não se importa se a Nuvemshop já mudou o status para 'Entregue'.
        const { rows: pedidos } = await sql`
            SELECT id_pedido, numero_pedido, rastreio 
            FROM pedidos_nuvemshop 
            WHERE rastreio IS NOT NULL 
              AND rastreio != ''
              AND data_entrega IS NULL 
            LIMIT ${limite};
        `;

        if (pedidos.length === 0) return { sucesso: true, mensagem: "Nenhum pedido pendente.", log: [] };

        for (const pedido of pedidos) {
            try {
                const respostaSmart = await fetch("https://api.smartenvios.com/v1/freight-order/tracking", {
                    method: "POST", 
                    headers: { "Content-Type": "application/json", "token": process.env.SMARTENVIOS_TOKEN },
                    body: JSON.stringify({ "tracking_code": pedido.rastreio })
                });

                if (respostaSmart.ok) {
                    const { result } = await respostaSmart.json();
                    
                    if (result && result.trackings && result.trackings.length > 0) {
                        // Ordena os eventos do mais antigo para o mais recente
                        const evt = result.trackings.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const statusTransportadora = evt[evt.length - 1].code.tracking_type;
                        
                        // Captura a data real de postagem (primeiro evento)
                        const dataPostagemReal = new Date(evt[0].date);

                        if (statusTransportadora === 'DELIVERED') {
                            // Se entregue, grava TUDO: data de envio real, data de entrega e força o status
                            const dataEntregaReal = new Date(evt[evt.length - 1].date);
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET status_nuvemshop = 'Entregue', 
                                    data_envio = ${dataPostagemReal}, 
                                    data_entrega = ${dataEntregaReal} 
                                WHERE id_pedido = ${pedido.id_pedido};
                            `;
                            atualizados++;
                        } else {
                            // Mesmo que ainda não tenha sido entregue, corrige a data de envio
                            // caso ela esteja errada no banco
                            await sql`
                                UPDATE pedidos_nuvemshop 
                                SET data_envio = ${dataPostagemReal} 
                                WHERE id_pedido = ${pedido.id_pedido} AND data_envio != ${dataPostagemReal};
                            `;
                        }
                    }
                }
            } catch (e) {
                console.error(`Erro ao processar rastreio do pedido ${pedido.numero_pedido}:`, e);
            }
            await delay(500); // Pausa para não sobrecarregar a API da SmartEnvios
        }
        return { sucesso: true, mensagem: `Resumo: ${atualizados} pedidos atualizados com sucesso.`, log: [] };
    } catch (erro) { 
        console.error("Erro geral no Motor de Logística:", erro);
        return { sucesso: false }; 
    }
}

router.get('/api/script/atualizar-rastreios', async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write("Iniciando verificação de rastreios...\n");
    const resultado = await processarRastreiosLogistica(50);
    res.end(`\n${resultado.mensagem}`);
});

router.get('/api/cron/verificar-entregas', async (req, res) => {
    const resultado = await processarRastreiosLogistica(15); 
    if (resultado.sucesso) res.status(200).json(resultado);
    else res.status(500).json(resultado);
});

module.exports = router;