// Função principal para carregar os módulos HTML
async function carregarModulo(nomeDoModulo) {
    const appDiv = document.getElementById('app');
    
    try {
        // Usa o fetch para buscar o arquivo HTML
        const resposta = await fetch(`/components/${nomeDoModulo}.html`);
        const html = await resposta.text();
        
        // Injeta o HTML na tela
        appDiv.innerHTML = html;

        // Após injetar, precisamos "ligar" os botões daquela tela
        if (nomeDoModulo === 'login') {
            iniciarEventosDeLogin();
        } else if (nomeDoModulo === 'painel') {
            iniciarEventosDoPainel();
        }

    } catch (erro) {
        console.error("Erro ao carregar o módulo:", erro);
        appDiv.innerHTML = "<p>Erro ao carregar a página.</p>";
    }
}

// Eventos específicos da tela de Login
function iniciarEventosDeLogin() {
    const formLogin = document.getElementById('form-login');
    const btnMostrarSenha = document.getElementById('btn-mostrar-senha');
    const inputSenha = document.getElementById('senha');
    const iconeSenha = document.getElementById('icone-senha');
    const msgErro = document.getElementById('mensagem-erro');

    // Lógica do Olhinho
    btnMostrarSenha.addEventListener('click', () => {
        if (inputSenha.type === 'password') {
            inputSenha.type = 'text';
            iconeSenha.textContent = 'visibility_off';
        } else {
            inputSenha.type = 'password';
            iconeSenha.textContent = 'visibility';
        }
    });

    // Lógica de Envio do Login (Sem recarregar a página)
    formLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // Impede a página de recarregar

        const usuario = document.getElementById('usuario').value;
        const senha = inputSenha.value;

        // Envia os dados para a nossa API no Node.js
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            // Se a API disser que a senha tá certa, carrega o painel
            carregarModulo('painel');
        } else {
            // Se errar, mostra a caixa vermelha
            msgErro.style.display = 'block';
        }
    });
}

// Eventos específicos da tela do Painel
function iniciarEventosDoPainel() {
    const btnLogout = document.getElementById('btn-logout');
    const btnBuscarPedidos = document.getElementById('btn-buscar-pedidos');
    const tabela = document.getElementById('tabela-pedidos');
    const corpoTabela = document.getElementById('corpo-tabela');
    
    // Lógica do botão de Sair
    btnLogout.addEventListener('click', async () => {
        await fetch('/api/logout');
        carregarModulo('login');
    });

    // Lógica para Buscar e Desenhar os Pedidos
    btnBuscarPedidos.addEventListener('click', async () => {
        // Muda o texto do botão para dar feedback ao usuário
        btnBuscarPedidos.textContent = 'Buscando pedidos...';
        
        try {
            // Chama a NOSSA rota do back-end (que vai falar com a Nuvemshop)
            const resposta = await fetch('/api/pedidos');
            
            if (!resposta.ok) {
                throw new Error("Erro ao consultar a API");
            }

            const pedidos = await resposta.json();

            // Limpa a tabela antes de preencher
            corpoTabela.innerHTML = '';

            // Laço de repetição: Para cada pedido na lista, cria uma linha na tabela
            pedidos.forEach(pedido => {
                const linha = document.createElement('tr');
                linha.style.borderBottom = "1px solid #eee"; // Estilo simples da linha
                
                // Coluna do Número do Pedido
                const colunaNumero = document.createElement('td');
                colunaNumero.style.padding = "12px";
                colunaNumero.textContent = `#${pedido.number}`;
                
                // Coluna do Nome do Cliente
                const colunaCliente = document.createElement('td');
                colunaCliente.style.padding = "12px";
                // A API da Nuvemshop manda o cliente dentro de 'customer'
                colunaCliente.textContent = pedido.customer ? pedido.customer.name : 'Cliente não informado';

                // Adiciona as colunas na linha, e a linha no corpo da tabela
                linha.appendChild(colunaNumero);
                linha.appendChild(colunaCliente);
                corpoTabela.appendChild(linha);
            });

            // Mostra a tabela e volta o texto do botão ao normal
            tabela.style.display = 'table';
            btnBuscarPedidos.textContent = 'Atualizar Pedidos Nuvemshop';

        } catch (erro) {
            console.error("Erro na busca:", erro);
            btnBuscarPedidos.textContent = 'Erro! Tentar novamente';
            alert("Não foi possível buscar os pedidos. Verifique se colocou os Tokens no server.js!");
        }
    });
}

// Quando o arquivo js carregar, carrega a tela de login por padrão
carregarModulo('login');