// ============================================================================
// SCRIPT: CONECTAR WHATSAPP (EVOLUTION API)
// Objetivo: Criar uma instância virtual e gerar o QR Code de conexão.
// ============================================================================

const fs = require('fs'); // Módulo nativo do Node.js para criar ficheiros

// 1. CONFIGURAÇÕES DA SUA API NO RENDER
const API_URL = "https://api-whatsapp-waltz.onrender.com"; // Substitua pelo link do seu Render
const GLOBAL_API_KEY = "Ame@220520"; // A senha exata que colocou na variável AUTHENTICATION_API_KEY

async function criarInstanciaEGerarQR() {
    console.log("🚀 A comunicar com o Render para criar o WhatsApp Virtual...");

    try {
        // 2. ENVIAR O COMANDO DE CRIAÇÃO PARA A EVOLUTION API
        const resposta = await fetch(`${API_URL}/instance/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // O cabeçalho 'apikey' é a fechadura de segurança do nosso servidor
                "apikey": GLOBAL_API_KEY 
            },
            // 3. CORPO DA MENSAGEM: O que queremos que o servidor faça
            body: JSON.stringify({
                instanceName: "loja_waltz", // Nome da sua instância (pode ser qualquer um)
                qrcode: true,               // Pedimos à API para gerar o QR Code agora mesmo
                integration: "WHATSAPP-BAILEYS" // Motor interno de conexão do WhatsApp
            })
        });

        // Convertendo a resposta do servidor para entender o que ele nos disse
        const dados = await resposta.json();

        // 4. PROCESSAR E SALVAR O QR CODE
        if (dados.qrcode && dados.qrcode.base64) {
            console.log("✅ Instância criada com sucesso! A preparar a imagem...");
            
            // Criamos um código HTML simples contendo a imagem gerada (em formato base64)
            const html = `
                <html style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f8fafc; font-family:sans-serif;">
                    <div style="text-align:center; background:white; padding:40px; border-radius:16px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color:#10b981; margin-bottom:20px;">📱 Conecte a sua Loja</h2>
                        <p>Abra o WhatsApp no seu telemóvel > Aparelhos Conectados > Conectar um aparelho</p>
                        <img src="${dados.qrcode.base64}" style="width:300px; height:300px; border:2px solid #e2e8f0; border-radius:8px;" />
                    </div>
                </html>
            `;
            
            // Escrevemos o ficheiro no seu computador
            fs.writeFileSync("qrcode.html", html);
            
            console.log("🎉 Pronto! O ficheiro 'qrcode.html' foi criado na sua pasta.");
            console.log("👉 Dê um duplo clique nele, abra no seu navegador e escaneie o código!");
            
        } else if (dados.instance) {
            console.log("⚠️ A instância já existe e está criada, mas não devolveu QR Code.");
            console.log("Detalhes:", dados);
        } else {
            console.error("❌ Ocorreu um problema:", dados);
        }

    } catch (erro) {
        console.error("❌ Erro ao tentar ligar ao servidor do Render:", erro.message);
    }
}

// Executar a função
criarInstanciaEGerarQR();