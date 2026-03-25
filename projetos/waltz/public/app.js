// ==========================================
// CONFIGURAÇÃO GERAL E ROTEAMENTO SPA
// ==========================================

// Variáveis Globais (Dados, Paginação e Ordenação)
let todaABaseDeClientes = []; 
let paginaAtualRelatorio = 1;
let itensPorPaginaRelatorio = 50;
let ordemAtualRelatorio = { coluna: -1, crescente: true }; // -1 = nenhuma, true = cre, false = dec

function renderView(view, targetId = 'app') {
    fetch(`/components/${view}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById(targetId).innerHTML = html;
            loadApp(view); 
        })
        .catch(err => console.error('Erro ao carregar view:', err));
}

// O MÓDULO DE NAVEGAÇÃO INTERNA DO PAINEL (NOVO)
function mostrarSubPaginaDash(subPagina) {
    const contentAreaId = 'dashboard-content-area';
    const titleId = 'dash-page-title';

    // 1. Limpa os estados de "ativo" do menu lateral
    document.querySelectorAll('.sidebar .nav-link').forEach(link => link.classList.remove('active'));

    // 2. Carrega a subpágina correta e atualiza o menu/título
    if (subPagina === 'tiny') {
        document.getElementById('nav-tiny').classList.add('active');
        document.getElementById(titleId).innerText = "Base de Clientes (Tiny LTV)";
        
        // Injeta a tabela do Tiny e dispara o autoload dos dados
        fetch('/components/relatorio_tiny.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById(contentAreaId).innerHTML = html;
                carregarRelatorioClientes(); // Autoload dos dados
            });

    } else if (subPagina === 'nuvem') {
        document.getElementById('nav-nuvem').classList.add('active');
        document.getElementById(titleId).innerText = "Monitor de Pedidos Nuvemshop";
        
        // Injeta a tabela da Nuvem
        fetch('/components/pedidos_nuvem.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById(contentAreaId).innerHTML = html;
                // Não faz autoload, usuário clica em buscar
            });
    }
}

// Liga os eventos dependendo da tela principal aberta
function loadApp(view) {
    if (view === 'login') {
        const form = document.getElementById('form-login');
        if (form) form.addEventListener('submit', realizarLogin);
        document.getElementById('btn-mostrar-senha')?.addEventListener('click', toggleSenha);
    } else if (view === 'painel') {
        // Carrega a subpágina padrão ao abrir o painel
        mostrarSubPaginaDash('tiny'); 
        document.getElementById('btn-logout')?.addEventListener('click', realizarLogout);
    }
}

// ==========================================
// FUNÇÕES DE LOGIN (Mantidas)
// ==========================================
async function realizarLogin(evento) {
    evento.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('mensagem-erro');
    const btnSubmit = document.querySelector('#form-login button');
    btnSubmit.innerText = "Acessando..."; btnSubmit.disabled = true;
    try {
        const resposta = await fetch('/api/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const resultado = await resposta.json();
        if (resultado.sucesso) renderView('painel'); 
        else { msgErro.style.display = 'block'; btnSubmit.innerText = "Entrar"; btnSubmit.disabled = false; }
    } catch (e) {
        msgErro.innerText = "Erro ao conectar."; msgErro.style.display = 'block';
        btnSubmit.innerText = "Entrar"; btnSubmit.disabled = false;
    }
}
function toggleSenha() {
    const inputSenha = document.getElementById('senha');
    const iconeSenha = document.getElementById('icone-senha');
    if (inputSenha.type === 'password') { inputSenha.type = 'text'; iconeSenha.textContent = 'visibility_off'; } 
    else { inputSenha.type = 'password'; iconeSenha.textContent = 'visibility'; }
}
async function realizarLogout() { await fetch('/api/logout'); renderView('login'); }

// ==========================================
// FUNÇÕES DA BASE TINY (Dados, Selos e Paginação)
// ==========================================
function classificarClienteVisual(totalPedidos, valorTotal) {
    if (totalPedidos === 0) return '<span class="selo sem-compra">SEM COMPRAS</span>';
    if (totalPedidos === 1) return '<span class="selo primeira-compra">1ª COMPRA</span>';
    if (valorTotal <= 1000) return '<span class="selo bronze">BRONZE</span>';
    if (valorTotal <= 3000) return '<span class="selo prata">PRATA</span>';
    if (valorTotal <= 6000) return '<span class="selo ouro">OURO</span>';
    return '<span class="selo diamante">DIAMANTE</span>';
}

async function carregarRelatorioClientes() {
    const tbody = document.getElementById('tabela-clientes-body');
    if (!tbody) return; // Segurança se a tabela não estiver na tela
    tbody.innerHTML = '<tr><td colspan="8">Carregando banco de dados...</td></tr>';
    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const dados = await resposta.json();
        if (dados.sucesso && dados.clientes.length > 0) {
            todaABaseDeClientes = dados.clientes;
            paginaAtualRelatorio = 1; 
            renderizarPaginaRelatorio(); 
        } else {
            tbody.innerHTML = '<tr><td colspan="8">Nenhum cliente no banco.</td></tr>';
        }
    } catch (erro) { tbody.innerHTML = '<tr><td colspan="8">Erro de conexão.</td></tr>'; }
}

function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    const filtro = document.getElementById("filtro-grupo").value;
    let dadosFiltrados = todaABaseDeClientes;
    
    // Aplica o filtro nos dados em memória
    if (filtro !== "TODOS") {
        dadosFiltrados = todaABaseDeClientes.filter(c => {
            let totalPedidos = c.total_pedidos || 0;
            let valorTotal = parseFloat(c.valor_total || 0);
            let grupoReal = "SEM COMPRAS";
            if (totalPedidos === 1) grupoReal = "PRIMEIRA COMPRA";
            else if (totalPedidos > 1) {
                if (valorTotal <= 1000) grupoReal = "BRONZE";
                else if (valorTotal <= 3000) grupoReal = "PRATA";
                else if (valorTotal <= 6000) grupoReal = "OURO";
                else grupoReal = "DIAMANTE";
            }
            return grupoReal === filtro; 
        });
    }

    // Paginação do front-end (slice 50 itens)
    const totalItens = dadosFiltrados.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPaginaRelatorio);
    if (paginaAtualRelatorio > totalPaginas && totalPaginas > 0) paginaAtualRelatorio = totalPaginas;
    const inicio = (paginaAtualRelatorio - 1) * itensPorPaginaRelatorio;
    const fim = inicio + itensPorPaginaRelatorio;
    const itensDaPagina = dadosFiltrados.slice(inicio, fim);

    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum cliente neste grupo.</td></tr>';
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
    renderizarControlesPaginacao(totalPaginas);
}

// Paginação Clássica Numerada
function renderizarControlesPaginacao(totalPaginas) {
    const container = document.getElementById('paginacao-ltv');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    let html = `<button class="btn-pag-nav" onclick="mudarPaginaRelatorio(-1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''}>«</button>`;
    let startPage = Math.max(1, paginaAtualRelatorio - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) { startPage = Math.max(1, endPage - 4); }
    for (let i = startPage; i <= endPage; i++) {
        html += (i === paginaAtualRelatorio) ? `<button class="btn-pag-num active">${i}</button>` : `<button class="btn-pag-num" onclick="irParaPaginaRelatorio(${i})">${i}</button>`;
    }
    html += `<button class="btn-pag-nav" onclick="mudarPaginaRelatorio(1)" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''}>»</button>`;
    container.innerHTML = html;
}
function mudarPaginaRelatorio(delta) { paginaAtualRelatorio += delta; renderizarPaginaRelatorio(); }
function irParaPaginaRelatorio(pagina) { paginaAtualRelatorio = pagina; renderizarPaginaRelatorio(); }
function resetarEPaginacao() { paginaAtualRelatorio = 1; renderizarPaginaRelatorio(); }

// ==========================================
// MOTOR DE ORDENAÇÃO CORRIGIDO E ROBUSTO
// ==========================================
function ordenarTabela(colunaIndex) {
    if (todaABaseDeClientes.length === 0) return;
    
    console.log(`⏳ Ordenando pela coluna ${colunaIndex}...`);

    // 1. Define a nova ordem
    if (ordemAtualRelatorio.coluna === colunaIndex) {
        ordemAtualRelatorio.crescente = !ordemAtualRelatorio.crescente;
    } else {
        ordemAtualRelatorio.coluna = colunaIndex;
        ordemAtualRelatorio.crescente = false; // Começa sempre do Maior p/ Menor (Desc)
    }

    // 2. Executa a ordenação nos DADOS BRUTOS em memória
    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        
        // Coluna Pedidos
        if (colunaIndex === 6) { 
            // Garante que é número inteiro e trata nulos como 0
            valA = parseInt(a.total_pedidos) || 0;
            valB = parseInt(b.total_pedidos) || 0;
        } 
        // Coluna Valor Total
        else if (colunaIndex === 7) { 
            // Garante que é número decimal e trata nulos como 0
            valA = parseFloat(a.valor_total) || 0;
            valB = parseFloat(b.valor_total) || 0;
        } else {
            return 0; // Coluna não ordenável
        }

        // Faz a comparação lógica
        if (valA < valB) return ordemAtualRelatorio.crescente ? -1 : 1;
        if (valA > valB) return ordemAtualRelatorio.crescente ? 1 : -1;
        return 0;
    });

    // 3. Atualiza os ícones visualmente nos cabeçalhos
    atualizarIconesOrdenacao(colunaIndex);

    // 4. Re-desenha a tabela (reseta para pág 1 para ver o resultado)
    resetarEPaginacao(); 
}

// Auxiliar para mudar os ícones ↕️ p/ ↑ ou ↓
function atualizarIconesOrdenacao(colunaAtiva) {
    // Reseta todos para o padrão ↕️
    const iconPedidos = document.getElementById('sort-icon-6');
    const iconValor = document.getElementById('sort-icon-7');
    if(iconPedidos) iconPedidos.innerText = '↕️';
    if(iconValor) iconValor.innerText = '↕️';

    // Aplica o ícone correto na coluna ativa
    const iconeAtivo = document.getElementById(`sort-icon-${colunaAtiva}`);
    if (iconeAtivo) {
        iconeAtivo.innerText = ordemAtualRelatorio.crescente ? '↑' : '↓';
    }
}

async function sincronizarTiny() { /* Mantido */ }

// ==========================================
// FUNÇÕES NUVEMSHOP (Feedback Renomeado)
// ==========================================
async function buscarPedidosNuvemshop() {
    const btn = document.getElementById('btn-buscar-pedidos');
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!btn || !tbody) return;
    btn.innerHTML = '<span class="material-symbols-outlined">downloading</span> Buscando...';
    btn.disabled = true;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Conectando com Nuvemshop...</td></tr>';
    try {
        const resposta = await fetch('/api/pedidos');
        const pedidos = await resposta.json();
        tbody.innerHTML = '';
        if(pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum pedido recente.</td></tr>';
            return;
        }
        pedidos.forEach(p => {
            const dataO = new Date(p.created_at);
            const dataF = dataO.toLocaleDateString('pt-BR') + ' ' + dataO.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            const cidade = p.shipping_address ? p.shipping_address.city : '-';
            const uf = p.shipping_address ? p.shipping_address.province : '-';
            let statusPt = p.status;
            if (p.status === 'open') statusPt = 'Aberto';
            if (p.status === 'closed') statusPt = 'Arquivado';
            if (p.status === 'canceled') statusPt = 'Cancelado';
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td style="white-space:nowrap">${dataF}</td>
                <td style="font-weight:bold; color:#2563eb;">#${p.number}</td>
                <td>${p.customer ? p.customer.name : '-'}</td>
                <td>${p.customer ? p.customer.identification : '-'}</td>
                <td>${cidade}/${uf}</td>
                <td>${p.shipping_option || '-'}</td>
                <td>${p.shipping_tracking_number || '-'}</td>
                <td>${statusPt}</td>
                <td style="text-align:center;"><span class="selo status-wpp-pendente">Aguardando Feedback</span></td>
            `;
            tbody.appendChild(linha);
        });
    } catch (e) { tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Erro na API Nuvemshop.</td></tr>';
    } finally { btn.innerHTML = '<span class="material-symbols-outlined">download</span> Buscar Pedidos Nuvem'; btn.disabled = false; }
}

// INICIALIZAÇÃO
renderView('login');