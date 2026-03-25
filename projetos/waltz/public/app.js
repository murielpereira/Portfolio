// ==========================================
// CONFIGURAÇÃO GERAL E ROTEAMENTO SPA
// ==========================================

let todaABaseDeClientes = []; 
let paginaAtualRelatorio = 1;
let itensPorPaginaRelatorio = 50;
let ordemAtualRelatorio = { coluna: -1, crescente: true };

// Injeta as telas no index.html dinamicamente
function renderView(view, targetId = 'app') {
    fetch(`/components/${view}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById(targetId).innerHTML = html;
            loadApp(view); // Ativa os botões da tela que acabou de carregar
        })
        .catch(err => console.error('Erro ao carregar view:', err));
}

// Liga os eventos dependendo da tela aberta
function loadApp(view) {
    if (view === 'login') {
        const form = document.getElementById('form-login');
        if (form) form.addEventListener('submit', realizarLogin);
        
        const btnMostrar = document.getElementById('btn-mostrar-senha');
        if (btnMostrar) btnMostrar.addEventListener('click', toggleSenha);
        
    } else if (view === 'painel') {
        carregarRelatorioClientes(); // Autoload da tabela LTV
        
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) btnLogout.addEventListener('click', realizarLogout);
    }
}

// ==========================================
// FUNÇÕES DE LOGIN E AUTENTICAÇÃO
// ==========================================

async function realizarLogin(evento) {
    evento.preventDefault(); // Impede a página de recarregar "piscando" a tela

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('mensagem-erro');
    const btnSubmit = document.querySelector('#form-login button');

    btnSubmit.innerText = "Acessando...";
    btnSubmit.disabled = true;

    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            renderView('painel'); // Se a senha estiver certa, abre o painel!
        } else {
            msgErro.style.display = 'block';
            btnSubmit.innerText = "Entrar no Sistema";
            btnSubmit.disabled = false;
        }
    } catch (erro) {
        msgErro.innerText = "Erro ao conectar com o servidor.";
        msgErro.style.display = 'block';
        btnSubmit.innerText = "Entrar no Sistema";
        btnSubmit.disabled = false;
    }
}

function toggleSenha() {
    const inputSenha = document.getElementById('senha');
    const iconeSenha = document.getElementById('icone-senha');
    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        iconeSenha.textContent = 'visibility_off';
    } else {
        inputSenha.type = 'password';
        iconeSenha.textContent = 'visibility';
    }
}

async function realizarLogout() {
    await fetch('/api/logout');
    renderView('login');
}

// ==========================================
// FUNÇÕES DE RELATÓRIO LTV (Autoload + Paginação + Filtro)
// ==========================================

function classificarClienteVisual(totalPedidos, valorTotal) {
    if (totalPedidos <= 1) return '<span class="selo primeira-compra">1ª COMPRA</span>';
    if (valorTotal <= 1000) return '<span class="selo bronze">BRONZE</span>';
    if (valorTotal <= 3000) return '<span class="selo prata">PRATA</span>';
    if (valorTotal <= 6000) return '<span class="selo ouro">OURO</span>';
    return '<span class="selo diamante">DIAMANTE</span>';
}

async function carregarRelatorioClientes() {
    const tbody = document.getElementById('tabela-clientes-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8">Buscando banco de dados Waltz...</td></tr>';

    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const dados = await resposta.json();

        if (dados.sucesso && dados.clientes.length > 0) {
            todaABaseDeClientes = dados.clientes;
            paginaAtualRelatorio = 1; 
            renderizarPaginaRelatorio(); 
        } else {
            tbody.innerHTML = '<tr><td colspan="8">Nenhum cliente no banco de dados. Clique em Atualizar Dados.</td></tr>';
        }
    } catch (erro) {
        tbody.innerHTML = '<tr><td colspan="8">Erro ao conectar com o servidor.</td></tr>';
    }
}

function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    const filtro = document.getElementById("filtro-grupo").value;
    
    let dadosFiltrados = todaABaseDeClientes;
    
    if (filtro !== "TODOS") {
        dadosFiltrados = todaABaseDeClientes.filter(c => {
            let totalPedidos = c.total_pedidos || 0;
            let valorTotal = parseFloat(c.valor_total || 0);
            let grupoReal = "PRIMEIRA COMPRA";
            if (totalPedidos > 1) {
                if (valorTotal <= 1000) grupoReal = "BRONZE";
                else if (valorTotal <= 3000) grupoReal = "PRATA";
                else if (valorTotal <= 6000) grupoReal = "OURO";
                else grupoReal = "DIAMANTE";
            }
            return grupoReal === filtro; 
        });
    }

    const totalItens = dadosFiltrados.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPaginaRelatorio);
    
    if (paginaAtualRelatorio > totalPaginas && totalPaginas > 0) paginaAtualRelatorio = totalPaginas;

    const inicio = (paginaAtualRelatorio - 1) * itensPorPaginaRelatorio;
    const fim = inicio + itensPorPaginaRelatorio;
    const itensDaPagina = dadosFiltrados.slice(inicio, fim);

    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum cliente encontrado neste grupo.</td></tr>';
    } else {
        itensDaPagina.forEach(cliente => {
            const valTotalNum = parseFloat(cliente.valor_total || 0);
            const seloHtml = classificarClienteVisual(cliente.total_pedidos || 0, valTotalNum);
            const valorFormatado = valTotalNum.toFixed(2).replace('.', ',');
            
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${cliente.nome}</td>
                <td style="white-space:nowrap">${cliente.telefone || '-'}</td>
                <td>${cliente.cpf}</td>
                <td>${cliente.cidade || '-'}</td>
                <td>${cliente.estado || '-'}</td>
                <td>${seloHtml}</td>
                <td>${cliente.total_pedidos || 0}</td>
                <td data-valor="${valTotalNum}">R$ ${valorFormatado}</td>
            `;
            tbody.appendChild(linha);
        });
    }

    document.getElementById('info-paginacao-ltv').innerText = `Página ${paginaAtualRelatorio} de ${totalPaginas || 1} (${totalItens} total)`;
    document.getElementById('btn-prev-ltv').disabled = (paginaAtualRelatorio === 1);
    document.getElementById('btn-next-ltv').disabled = (paginaAtualRelatorio === totalPaginas || totalPaginas === 0);
}

function mudarPaginaRelatorio(delta) {
    paginaAtualRelatorio += delta;
    renderizarPaginaRelatorio();
}

function resetarEPaginacao() {
    paginaAtualRelatorio = 1; 
    renderizarPaginaRelatorio();
}

function ordenarTabela(colunaIndex) {
    if (todaABaseDeClientes.length === 0) return;

    if (ordemAtualRelatorio.coluna === colunaIndex) {
        ordemAtualRelatorio.crescente = !ordemAtualRelatorio.crescente;
    } else {
        ordemAtualRelatorio.coluna = colunaIndex;
        ordemAtualRelatorio.crescente = false; 
    }

    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        if (colunaIndex === 6) { 
            valA = a.total_pedidos || 0;
            valB = b.total_pedidos || 0;
        } else if (colunaIndex === 7) { 
            valA = parseFloat(a.valor_total || 0);
            valB = parseFloat(b.valor_total || 0);
        }

        if (valA < valB) return ordemAtualRelatorio.crescente ? -1 : 1;
        if (valA > valB) return ordemAtualRelatorio.crescente ? 1 : -1;
        return 0;
    });

    renderizarPaginaRelatorio(); 
}

async function sincronizarTiny() {
    const btn = event.target;
    btn.disabled = true;
    let paginaAtual = 1;
    let terminou = false;
    let totalSalvos = 0;

    while (!terminou) {
        btn.innerText = `🔄 Sincronizando... Lendo página ${paginaAtual} do Tiny`;
        try {
            const resposta = await fetch('/api/relatorios/sincronizar-contatos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pagina: paginaAtual })
            });
            const dados = await resposta.json();
            
            if (dados.sucesso) {
                totalSalvos += dados.salvosNesteLote;
                paginaAtual = dados.proximaPagina;
                terminou = dados.concluiu;
            } else {
                alert("Erro ao sincronizar na página " + paginaAtual);
                terminou = true;
            }
        } catch (erro) {
            alert("Erro de conexão na página " + paginaAtual);
            terminou = true;
        }
    }

    btn.innerText = '🔄 Atualizar Dados com Tiny';
    btn.disabled = false;
    alert(`Sincronização concluída!`);
    carregarRelatorioClientes();
}

// INICIALIZAÇÃO DA APLICAÇÃO
renderView('login');