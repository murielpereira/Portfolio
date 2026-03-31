const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');

async function agendarMensagemWhatsApp(pedido, etapaLogistica) {
    try {
        let telefoneBase = (pedido.telefone || '').replace(/\D/g, '');
        if (!telefoneBase) return false;
        if (telefoneBase.length === 10 || telefoneBase.length === 11) telefoneBase = `55${telefoneBase}`;

        const { rows } = await sql`SELECT msg_aprovado, msg_fabricacao, msg_rastreio, msg_rota, msg_feedback FROM configuracoes_sistema LIMIT 1;`;
        if (rows.length === 0) return false;
        
        const config = rows[0];
        let templateMensagem = "";

        switch (etapaLogistica) {
            case 'aprovado': templateMensagem = config.msg_aprovado; break;
            case 'fabricacao': templateMensagem = config.msg_fabricacao; break;
            case 'rastreio': templateMensagem = config.msg_rastreio; break;
            case 'rota': templateMensagem = config.msg_rota; break;
            case 'feedback': templateMensagem = config.msg_feedback; break;
            default: return false; 
        }

        if (!templateMensagem || templateMensagem.trim() === "") return false;

        let mensagemFinal = templateMensagem
            .replace(/{nome}/g, pedido.nome_cliente ? pedido.nome_cliente.split(' ')[0] : 'Cliente')
            .replace(/{pedido}/g, pedido.numero_pedido || '')
            .replace(/{rastreio}/g, pedido.rastreio || 'Aguardando código')
            .replace(/{link_rastreio}/g, pedido.rastreio ? `https://linkderastreio.com/${pedido.rastreio}` : ''); 

        const idValido = pedido.id_pedido ? pedido.id_pedido : 0; 
        
        await sql`
            INSERT INTO fila_mensagens (id_pedido, telefone, mensagem, status)
            VALUES (${idValido}, ${telefoneBase}, ${mensagemFinal}, 'pendente');
        `;
        return true;
    } catch (erro) {
        console.error(`❌ Erro agendar WhatsApp:`, erro.message);
        return false;
    }
}

router.get('/teste-whatsapp', async (req, res) => {
    const { telefone } = req.query;
    if (!telefone) return res.status(400).json({ erro: 'Faltou o número!' });

    const pedidoFalso = { numero_pedido: 'TESTE-777', nome_cliente: 'Mestre da Programação', telefone: telefone, rastreio: 'BR123456789BR' };

    try {
        const sucesso = await agendarMensagemWhatsApp(pedidoFalso, 'aprovado');
        if (sucesso) return res.status(200).json({ sucesso: true, mensagem: `Mágica realizada!` });
        else return res.status(500).json({ erro: 'Falha ao enviar.' });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro interno.' });
    }
});

router.get('/processar-fila', async (req, res) => {
    try {
        const { rows: fila } = await sql`SELECT * FROM fila_mensagens WHERE status = 'pendente' AND tentativas < 3 ORDER BY data_criacao ASC LIMIT 10;`;
        if (fila.length === 0) return res.send("Fila vazia.");

        fetch(`${process.env.SERVER_URL}/instance/fetchInstances`, { headers: { 'apikey': process.env.AUTHENTICATION_API_KEY } }).catch(() => {}); 

        let enviadas = 0;
        const baseUrl = (process.env.SERVER_URL || '').replace(/\/$/, ''); 
        const URL = `${baseUrl}/message/sendText/loja_waltz`;

        for (const item of fila) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 180000);
                
                const resposta = await fetch(URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': process.env.AUTHENTICATION_API_KEY },
                    body: JSON.stringify({ number: item.telefone, text: item.mensagem }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (resposta.ok) {
                    await sql`UPDATE fila_mensagens SET status = 'enviado', data_envio = NOW() WHERE id = ${item.id}`;
                    enviadas++;
                } else {
                    await sql`UPDATE fila_mensagens SET tentativas = tentativas + 1 WHERE id = ${item.id}`;
                }
            } catch (e) {
                await sql`UPDATE fila_mensagens SET tentativas = tentativas + 1 WHERE id = ${item.id}`;
            }
        }
        res.send(`Processamento concluído. Enviadas: ${enviadas}`);
    } catch (erro) {
        res.status(500).send("Erro ao processar fila.");
    }
});

module.exports = router;