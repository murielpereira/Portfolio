// ==========================================
// ARQUIVO: routes/whatsapp.js
// Objetivo: Motor de Fila e Disparo de Mensagens
// ==========================================
const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');

// ----------------------------------------------------------------------------
// FUNÇÃO: Agendar Mensagem (Salvar na Fila do Banco de Dados)
// ----------------------------------------------------------------------------
async function agendarMensagemWhatsApp(pedido, etapaLogistica) {
    try {
        // 1. Limpar e formatar o número do cliente
        let telefoneBase = (pedido.telefone || '').replace(/\D/g, '');
        if (!telefoneBase) return false;
        if (telefoneBase.length === 10 || telefoneBase.length === 11) {
            telefoneBase = `55${telefoneBase}`;
        }

        // 2. Buscar as configurações de mensagens no banco de dados Neon
        const { rows } = await sql`SELECT msg_aprovado, msg_fabricacao, msg_rastreio, msg_rota, msg_feedback FROM configuracoes_sistema LIMIT 1;`;
        if (rows.length === 0) return false;
        
        const config = rows[0];
        let templateMensagem = "";

        // 3. Escolher o texto correto baseado na etapa
        switch (etapaLogistica) {
            case 'aprovado': templateMensagem = config.msg_aprovado; break;
            case 'fabricacao': templateMensagem = config.msg_fabricacao; break;
            case 'rastreio': templateMensagem = config.msg_rastreio; break;
            case 'rota': templateMensagem = config.msg_rota; break;
            case 'feedback': templateMensagem = config.msg_feedback; break;
            default: return false; 
        }

        if (!templateMensagem || templateMensagem.trim() === "") return false;

        // 4. Substituir as tags dinâmicas
        let mensagemFinal = templateMensagem
            .replace(/{nome}/g, pedido.nome_cliente ? pedido.nome_cliente.split(' ')[0] : 'Cliente')
            .replace(/{pedido}/g, pedido.numero_pedido || '')
            .replace(/{rastreio}/g, pedido.rastreio || 'Aguardando código')
            .replace(/{link_rastreio}/g, pedido.rastreio ? `https://linkderastreio.com/${pedido.rastreio}` : ''); 

        const idValido = pedido.id_pedido ? pedido.id_pedido : 0; 
        
        // 5. Inserir na fila de mensagens
        await sql`
            INSERT INTO fila_mensagens (id_pedido, telefone, mensagem, status)
            VALUES (${idValido}, ${telefoneBase}, ${mensagemFinal}, 'pendente');
        `;
        return true;

    } catch (erro) {
        console.error(`❌ Erro ao agendar WhatsApp:`, erro.message);
        return false;
    }
}

// ----------------------------------------------------------------------------
// ROTA: Teste Manual de Agendamento
// ----------------------------------------------------------------------------
router.get('/teste-whatsapp', async (req, res) => {
    const { telefone } = req.query;
    if (!telefone) return res.status(400).json({ erro: 'Faltou o número! Ex: /teste-whatsapp?telefone=55...' });

    // Log visual para termos certeza de que o NOVO código está rodando na Vercel
    console.log(`🚀 [NOVO SISTEMA] Adicionando teste à fila para o número: ${telefone}`);

    const pedidoFalso = { 
        numero_pedido: 'TESTE-777', 
        nome_cliente: 'Mestre da Programação', 
        telefone: telefone, 
        rastreio: 'BR123456789BR' 
    };

    try {
        const sucesso = await agendarMensagemWhatsApp(pedidoFalso, 'aprovado');
        if (sucesso) {
            return res.status(200).json({ sucesso: true, mensagem: `Mágica realizada! Mensagem na fila.` });
        } else {
            return res.status(500).json({ erro: 'Falha ao agendar mensagem.' });
        }
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

// ----------------------------------------------------------------------------
// ROTA: O "Despachante" (Processar a Fila e Enviar de Fato)
// ----------------------------------------------------------------------------
router.get('/processar-fila', async (req, res) => {
    try {
        // 1. Busca mensagens pendentes (máximo 10 por vez)
        const { rows: fila } = await sql`
            SELECT * FROM fila_mensagens 
            WHERE status = 'pendente' AND tentativas < 3 
            ORDER BY data_criacao ASC LIMIT 10;
        `;

        if (fila.length === 0) return res.send("Fila vazia. Nada a processar.");

        // 2. Acorda o Render (Evolution API) silenciosamente
        fetch(`${process.env.SERVER_URL}/instance/fetchInstances`, { 
            headers: { 'apikey': process.env.AUTHENTICATION_API_KEY } 
        }).catch(() => {}); 

        let enviadas = 0;
        const baseUrl = (process.env.SERVER_URL || '').replace(/\/$/, ''); 
        const URL = `${baseUrl}/message/sendText/loja_waltz`; // Instância fixa

        // 3. Processa cada mensagem da fila
        for (const item of fila) {
            try {
                // Timeout de segurança: 3 minutos (180000ms) para evitar que a Vercel trave
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 180000);
                
                const resposta = await fetch(URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'apikey': process.env.AUTHENTICATION_API_KEY 
                    },
                    body: JSON.stringify({ 
                        number: item.telefone, 
                        text: item.mensagem 
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                // 4. Atualiza o status no banco de dados com base na resposta
                if (resposta.ok) {
                    await sql`UPDATE fila_mensagens SET status = 'enviado', data_envio = NOW() WHERE id = ${item.id}`;
                    enviadas++;
                } else {
                    await sql`UPDATE fila_mensagens SET tentativas = tentativas + 1 WHERE id = ${item.id}`;
                }
            } catch (e) {
                // Em caso de erro de timeout ou conexão, incrementa a tentativa
                await sql`UPDATE fila_mensagens SET tentativas = tentativas + 1 WHERE id = ${item.id}`;
            }
        }
        
        res.send(`Processamento concluído. Enviadas: ${enviadas}`);
        
    } catch (erro) {
        console.error("❌ Erro ao processar a fila:", erro.message);
        res.status(500).send("Erro ao processar fila.");
    }
});

// Exporta as rotas para o server.js
module.exports = router;