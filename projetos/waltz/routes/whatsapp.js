const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');

// ----------------------------------------------------------------------------
// FUNÇÃO: Agendar Mensagem (Salvar na Fila do Banco de Dados)
// ----------------------------------------------------------------------------
async function agendarMensagemWhatsApp(pedido, etapaLogistica) {
    try {
        let telefoneBase = (pedido.telefone || '').replace(/\D/g, '');
        if (!telefoneBase) return false;
        if (telefoneBase.length === 10 || telefoneBase.length === 11) telefoneBase = `55${telefoneBase}`;

        // 1. Busca tanto os templates quanto o status do WhatsApp no banco
        const { rows } = await sql`SELECT chave, valor FROM configuracoes_sistema WHERE chave IN ('templates_wpp', 'whatsapp_ativo');`;
        
        // Agrupa os resultados num objeto mais fácil de ler
        const configDb = {};
        rows.forEach(r => configDb[r.chave] = r.valor);

        // Se a chave não existir no banco (primeira vez), o padrão é false.
        const isWhatsAppAtivo = configDb.whatsapp_ativo === 'true';
        
        if (!isWhatsAppAtivo) {
            console.log(`⏸️ [WHATSAPP DESATIVADO] Pedido ${pedido.numero_pedido || id_pedido} ignorado.`);
            return false; // Sai da função, a mensagem não vai para a fila!
        }
        // ==========================================================

        if (!configDb.templates_wpp) return false;
        const configTemplates = typeof configDb.templates_wpp === 'string' ? JSON.parse(configDb.templates_wpp) : configDb.templates_wpp;
        
        let templateMensagem = "";

        // Continua com o seu switch normal...
        switch (etapaLogistica) {
            case 'aprovado': templateMensagem = configTemplates.aprovado; break;
            case 'fabricacao': templateMensagem = configTemplates.fabricacao; break;
            case 'rastreio': templateMensagem = config.rastreio; break;
            case 'rota': templateMensagem = config.rota; break;
            case 'feedback': templateMensagem = config.feedback; break;
            default: return false; 
        }

        if (!templateMensagem || templateMensagem.trim() === "") return false;

        // 5. Substituir as tags dinâmicas
        let mensagemFinal = templateMensagem
            .replace(/{nome}/g, pedido.nome_cliente ? pedido.nome_cliente.split(' ')[0] : 'Cliente')
            .replace(/{pedido}/g, pedido.numero_pedido || '')
            .replace(/{rastreio}/g, pedido.rastreio || 'Aguardando código')
            .replace(/{link_rastreio}/g, pedido.rastreio ? `https://linkderastreio.com/${pedido.rastreio}` : ''); 

        const idValido = pedido.id_pedido ? pedido.id_pedido : 0; 
        
        // 6. Inserir na fila de mensagens
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

router.get('/processar-fila', async (req, res) => {
    try {
        // FIX: O "Despertador" do Render agora vem PRIMEIRO!
        // A cada 10 minutos, o cron acorda o Render independentemente de haver fila ou não.
        fetch(`${process.env.SERVER_URL}/instance/fetchInstances`, { 
            headers: { 'apikey': process.env.AUTHENTICATION_API_KEY } 
        }).catch(() => {}); 

        // Blindagem: Garante colunas de controlo
        try { await sql`ALTER TABLE fila_mensagens ADD COLUMN IF NOT EXISTS tentativas INT DEFAULT 0;`; } catch(e){}
        try { await sql`ALTER TABLE fila_mensagens ADD COLUMN IF NOT EXISTS data_envio TIMESTAMP;`; } catch(e){}

        const { rows: fila } = await sql`
            SELECT * FROM fila_mensagens 
            WHERE status ILIKE 'pendente' AND tentativas < 5 
            ORDER BY data_criacao ASC LIMIT 10;
        `;

        if (fila.length === 0) return res.send("Fila vazia. Servidor do WhatsApp pingado para se manter acordado.");

        let enviadas = 0;
        const baseUrl = (process.env.SERVER_URL || '').replace(/\/$/, ''); 
        const URL = `${baseUrl}/message/sendText/loja_waltz`;

        for (const item of fila) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
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

                if (resposta.ok) {
                    await sql`UPDATE fila_mensagens SET status = 'enviado', data_envio = NOW() WHERE id = ${item.id}`;
                    enviadas++;
                } else {
                    await sql`UPDATE fila_mensagens SET tentativas = COALESCE(tentativas, 0) + 1 WHERE id = ${item.id}`;
                }
            } catch (e) {
                console.log(`⏳ Falha na comunicação com o Render: ${e.message}. Abortando ciclo.`);
                break; 
            }
        }
        
        res.status(200).send(`Processamento concluído. Enviadas: ${enviadas}`);
        
    } catch (erro) {
        console.error("❌ Erro ao processar a fila:", erro.message);
        res.status(500).send("Erro ao processar fila.");
    }
});

router.get('/api/whatsapp/qrcode', async (req, res) => {
    try {
        const baseUrl = (process.env.SERVER_URL || '').replace(/\/$/, ''); 
        const urlConnect = `${baseUrl}/instance/connect/loja_waltz`;

        // 1. Pede o QR Code ao Render
        const resposta = await fetch(urlConnect, {
            headers: { 'apikey': process.env.AUTHENTICATION_API_KEY }
        });

        // 2. Lemos a resposta crua para entender o que o Render está a dizer
        const dados = await resposta.json();

        // LOG DE DIAGNÓSTICO: Isto vai aparecer nos logs da Vercel!
        console.log("🔍 Resposta do Render ao pedir QR Code:", JSON.stringify(dados, null, 2));

        // 3. Analisamos a resposta
        if (dados.base64) {
            // Sucesso! Temos a imagem.
            return res.json({ sucesso: true, qrcode: dados.base64 });
        } else if (dados.instance?.state === 'open') {
            // Já está conectado.
            return res.json({ sucesso: false, erro: 'A instância já está conectada!' });
        } else {
            // A MÁGICA AQUI: Vamos enviar o erro REAL do Render para a sua tela!
            // Ele geralmente vem dentro de "dados.error" ou "dados.message"
            const erroReal = dados.error || dados.message || 'Erro desconhecido no Render.';
            return res.json({ sucesso: false, erro: `Falha no Render: ${erroReal}` });
        }
    } catch (erro) {
        console.error("❌ Erro fatal ao buscar QR Code:", erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro de comunicação com o servidor do WhatsApp.' });
    }
});

// Exporta as rotas para o server.js
module.exports = router;