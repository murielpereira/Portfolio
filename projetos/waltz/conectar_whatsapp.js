// ==========================================
// ARQUIVO: public/conectar_whatsapp.js
// Objetivo: Buscar e exibir o QR Code no ecrã
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const btnGerar = document.getElementById('btn-gerar');
    const qrImg = document.getElementById('qrcode-img');
    const loading = document.getElementById('loading-spinner');
    const statusMsg = document.getElementById('status-msg');

    // Função que pede o QR Code ao nosso Back-end
    async function gerarQRCode() {
        // Atualiza a interface (feedback visual)
        btnGerar.innerText = "A gerar código...";
        btnGerar.disabled = true;
        qrImg.style.display = "none";
        loading.style.display = "block";
        loading.innerText = "Conectando ao servidor...";
        statusMsg.innerText = "";

        try {
            // Chama a nossa rota segura
            const resposta = await fetch('/api/whatsapp/qrcode');
            const dados = await resposta.json();

            if (dados.sucesso && dados.qrcode) {
                // Sucesso! Coloca a imagem Base64 na tag <img>
                qrImg.src = dados.qrcode;
                qrImg.style.display = "block";
                loading.style.display = "none";
                statusMsg.style.color = "#10b981";
                statusMsg.innerText = "Leia o QR Code rapidamente (expira em 40s).";
            } else {
                // Trata o caso de já estar conectado ou erros
                loading.innerText = "❌";
                statusMsg.style.color = "#ef4444";
                statusMsg.innerText = dados.erro || "Falha ao gerar o código.";
            }
        } catch (erro) {
            loading.innerText = "❌";
            statusMsg.style.color = "#ef4444";
            statusMsg.innerText = "Erro de conexão com a API.";
        } finally {
            // Restaura o botão
            btnGerar.innerText = "Gerar Novo QR Code";
            btnGerar.disabled = false;
        }
    }

    // Vincula a função ao clique do botão
    btnGerar.addEventListener('click', gerarQRCode);
});