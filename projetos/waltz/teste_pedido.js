// teste_pedido.js
require('dotenv').config();

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const TOKEN_NUVEM = process.env.NUVEMSHOP_TOKEN;
const ID_ALVO = '1868315462'; 

async function forcarArquivamentoNuvemshop() {
    console.log(`\n🚀 Iniciando finalização do pedido ID: ${ID_ALVO} na Nuvemshop`);

    try {
        console.log(`\n🚚 Como a transportadora travou o pacote, vamos Arquivar o pedido principal para encerrar o ciclo...`);
        
        // Voltamos para a URL principal do pedido
        const urlAtualizacao = `https://api.nuvemshop.com.br/v1/${STORE_ID}/orders/${ID_ALVO}`;
        
        const respostaAtualizacao = await fetch(urlAtualizacao, {
            method: "PUT",
            headers: { 
                'Authentication': `bearer ${TOKEN_NUVEM}`, 
                'Content-Type': 'application/json',
                'User-Agent': 'Waltz'
            },
            // A MÁGICA: Em vez de brigar com o envio, nós Arquivamos o pedido!
            body: JSON.stringify({ status: "closed" })
        });

        if (respostaAtualizacao.ok) {
            console.log(`✅ SUCESSO ABSOLUTO! O pedido foi forçado para 'Arquivado' (closed) na Nuvemshop!`);
            console.log(`Isso encerra as pendências na plataforma Nuvemshop.`);
            console.log(`E como já programamos antes, o seu painel Waltz manterá o botão de WhatsApp VERDE para pedidos Arquivados!`);
        } else {
            const erroTexto = await respostaAtualizacao.text();
            console.error(`❌ A Nuvemshop recusou a atualização. Motivo:`, erroTexto);
        }

        process.exit(0);

    } catch (erro) {
        console.error("❌ Erro fatal no script:", erro.message);
        process.exit(1);
    }
}

forcarArquivamentoNuvemshop();