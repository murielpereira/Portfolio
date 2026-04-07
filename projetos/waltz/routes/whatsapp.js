const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');

// ----------------------------------------------------------------------------
// FUNÇÃO: Agendar Mensagem (Salvar na Fila do Banco de Dados)
// ----------------------------------------------------------------------------
router.agendarMensagemWhatsApp = async function (pedido, etapaLogistica) {
    try {
        let telefoneBase = (pedido.telefone || '').replace(/\D/g, '');
        if (!telefoneBase) return false;
        if (telefoneBase.length === 10 || telefoneBase.length === 11) telefoneBase = `55${telefoneBase}`;

        const { rows } = await sql`SELECT * FROM configuracoes_sistema LIMIT 1;`;
        const configDb = rows[0] || {};
        if (configDb.wpp_ativo !== true) return false; 

        // Definição da Prioridade e Data Agendada
        let prioridade = 2; // 1=Urgente, 2=Normal
        let dataAgendada = new Date();
        const horarios = configDb.horarios_wpp || { inicio: '08:00', fim: '18:00', dias: [1,2,3,4,5] };

        if (['aprovado', 'rastreio', 'rota'].includes(etapaLogistica)) {
            prioridade = 1; 
        } else {
            prioridade = 2; 
            if (etapaLogistica === 'fabricacao') dataAgendada.setHours(dataAgendada.getHours() + 48); // 48h base
            if (etapaLogistica === 'feedback') dataAgendada.setDate(dataAgendada.getDate() + 30); // 30 dias
            
            // Corrige para o horário comercial e dias permitidos
            let hora = dataAgendada.getHours();
            let startH = parseInt(horarios.inicio.split(':')[0]);
            let endH = parseInt(horarios.fim.split(':')[0]);
            
            if (hora < startH) { dataAgendada.setHours(startH, 0, 0); }
            if (hora >= endH) { dataAgendada.setDate(dataAgendada.getDate() + 1); dataAgendada.setHours(startH, 0, 0); }
            while (!horarios.dias.includes(dataAgendada.getDay())) {
                dataAgendada.setDate(dataAgendada.getDate() + 1);
                dataAgendada.setHours(startH, 0, 0);
            }
        }

        // Puxa o texto base e monta a mensagem
        let templateMensagem = configDb[`msg_${etapaLogistica}`] || '';
        let ativo = configDb[`ativo_${etapaLogistica}`] !== false;
        if (!ativo || templateMensagem.trim() === '') return false;

        let mensagemFinal = templateMensagem
            .replace(/{nome}/g, pedido.nome_cliente ? pedido.nome_cliente.split(' ')[0] : 'Cliente')
            .replace(/{pedido}/g, pedido.numero_pedido || '')
            .replace(/{rastreio}/g, pedido.rastreio || 'Aguardando código')
            .replace(/{link_rastreio}/g, pedido.rastreio ? `https://linkderastreio.com/${pedido.rastreio}` : '')
            .replace(/{produtos}/g, pedido.produtos || 'produtos'); 

        const idValido = pedido.id_pedido || pedido.numero_pedido || '0'; 

        await sql`
            INSERT INTO fila_mensagens (id_pedido, telefone, mensagem, status, prioridade, tipo_mensagem, data_agendada)
            VALUES (${idValido}, ${telefoneBase}, ${mensagemFinal}, 'pendente', ${prioridade}, ${etapaLogistica}, ${dataAgendada.toISOString()});
        `;
        return true;
    } catch (e) { console.log("Erro no agendamento", e); return false; }
};

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
        fetch(`${process.env.SERVER_URL}/instance/fetchInstances`, { headers: { 'apikey': process.env.AUTHENTICATION_API_KEY } }).catch(() => {}); 

        // O Funil Inteligente: Até 4 urgentes (passam reto), mas APENAS 1 normal por minuto (respeita as pausas!)
        const { rows: filaUrgente } = await sql`SELECT * FROM fila_mensagens WHERE status ILIKE 'pendente' AND prioridade = 1 AND tentativas < 5 AND data_agendada <= NOW() ORDER BY data_criacao ASC LIMIT 4;`;
        const { rows: filaNormal } = await sql`SELECT * FROM fila_mensagens WHERE status ILIKE 'pendente' AND prioridade = 2 AND tentativas < 5 AND data_agendada <= NOW() ORDER BY data_agendada ASC LIMIT 1;`;
        
        const fila = [...filaUrgente, ...filaNormal];

        if (fila.length === 0) return res.send("Fila vazia ou aguardando horário.");
        let enviadas = 0;
        const URL = `${(process.env.SERVER_URL || '').replace(/\/$/, '')}/message/sendText/loja_waltz`;

        for (const item of fila) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const resposta = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': process.env.AUTHENTICATION_API_KEY }, body: JSON.stringify({ number: item.telefone, text: item.mensagem }), signal: controller.signal });
                clearTimeout(timeoutId);
                if (resposta.ok) { await sql`UPDATE fila_mensagens SET status = 'enviado', data_envio = NOW() WHERE id = ${item.id}`; enviadas++; } 
                else { await sql`UPDATE fila_mensagens SET tentativas = COALESCE(tentativas, 0) + 1 WHERE id = ${item.id}`; }
            } catch (e) { break; }
        }
        res.status(200).send(`Enviadas: ${enviadas}`);
    } catch (erro) { res.status(500).send("Erro na fila."); }
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