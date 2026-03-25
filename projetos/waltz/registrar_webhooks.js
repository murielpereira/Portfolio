// registrar_webhooks.js
// Script para cadastrar as URLs de aviso automático na Nuvemshop

// 1. PREENCHA SUAS INFORMAÇÕES AQUI (As mesmas que estão na Vercel)
const STORE_ID = '4916830'; 
const ACCESS_TOKEN = '7683de2688cbca193378a1947c510391be1bc7eb';
const URL_DO_SEU_APP = 'https://waltz-automacao.vercel.app/api/webhook/nuvemshop';

// Os dois eventos que queremos que a Nuvemshop nos avise
const eventosParaRegistrar = [
    'order/created', // Quando entra um pedido novo
    'order/updated'  // Quando o pedido é pago, embalado, arquivado, etc.
];

async function registrarWebhooks() {
    console.log("⏳ Iniciando registro de Webhooks na Nuvemshop...");

    for (const evento of eventosParaRegistrar) {
        try {
            const resposta = await fetch(`https://api.nuvemshop.com.br/v1/${STORE_ID}/webhooks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication': `bearer ${ACCESS_TOKEN}`,
                    'User-Agent': 'Waltz (murielpereirabr@gmail.com)'
                },
                body: JSON.stringify({
                    event: evento,
                    url: URL_DO_SEU_APP
                })
            });

            const dados = await resposta.json();

            if (resposta.ok || resposta.status === 201) {
                console.log(`✅ SUCESSO! Webhook para o evento [${evento}] registrado.`);
            } else {
                console.log(`❌ ERRO no evento [${evento}]:`, dados.message || dados.description);
            }

        } catch (erro) {
            console.error(`❌ Falha de conexão ao tentar registrar [${evento}]:`, erro.message);
        }
    }
    
    console.log("🏁 Processo finalizado.");
}

registrarWebhooks();