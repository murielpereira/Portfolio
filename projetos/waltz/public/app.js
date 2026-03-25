// ==========================================
// CONFIGURAÇÃO GERAL E ROTEAMENTO SPA
// ==========================================

// Variáveis globais para a Paginação do Relatório
let todaABaseDeClientes = []; // Guarda todos os dados vindos do servidor
let paginaAtualRelatorio = 1;
let itensPorPaginaRelatorio = 50;
let ordemAtualRelatorio = { coluna: -1, crescente: true };

function renderView(view, targetId = 'app') {
    fetch(`/components/${view}.html`)
        .then(response => response.text())
        .then(html => {
            const target = document.getElementById(targetId);
            target.innerHTML = html;
            // Após injetar o HTML, carrega os eventos e dados específicos da tela
            loadApp(view);
        })
        .catch(err => console.error('Erro ao carregar view:', err));
}

// O NOVO LOADAPP: Gerencia o autoload e eventos de cada tela
function loadApp(view) {
    if (view === 'login') {
        const form = document.getElementById('form-login');
        if (form) form.addEventListener('submit', realizarLogin);
        // O evento do botão de mostrar senha precisa ser reinicializado
        document.getElementById('btn-mostrar-senha')?.addEventListener('click', toggleSenha);
    } else if (view === 'painel') {
        // AUTOLOAD: Abriu o painel, carrega a tabela automaticamente do banco
        carregarRelatorioClientes(); 
        
        // Evento do botão sair
        document.getElementById('btn-logout')?.addEventListener('click', realizarLogout);
    }
}

// ... FUNÇÕES DE LOGIN MANTIDAS ...
async function realizarLogin(event) { /* ... mantido ... */ }
function toggleSenha() { /* ... mantido ... */ }
async function realizarLogout() { /* ... mantido ... */ }

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

// 1. CARGA INICIAL: Puxa tudo do servidor e guarda na memória
async function carregarRelatorioClientes() {
    const tbody = document.getElementById('tabela-clientes-body');
    if (!tbody) return; // Segurança

    tbody.innerHTML = '<tr><td colspan="8">Buscando banco de dados Waltz...</td></tr>';

    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const dados = await resposta.json();

        if (dados.sucesso && dados.clientes.length > 0) {
            todaABaseDeClientes = dados.clientes; // Guarda na variável global
            paginaAtualRelatorio = 1; // Reseta para a primeira página
            renderizarPaginaRelatorio(); // Desenha a tabela com os primeiros 50
        } else {
            tbody.innerHTML = '<tr><td colspan="8">Nenhum cliente no banco de dados. Sincronize com o Tiny.</td></tr>';
        }
    } catch (erro) {
        tbody.innerHTML = '<tr><td colspan="8">Erro ao conectar com o servidor.</td></tr>';
    }
}

// 2. RENDERIZAÇÃO: Desenha apenas os 50 itens da página atual (Considerando os filtros)
function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    
    // Primeiro: Aplica o filtro nos dados que estão na memória
    const filtro = document.getElementById("filtro-grupo").value;
    let dadosFiltrados = todaABaseDeClientes;
    
    if (filtro !== "TODOS") {
        dadosFiltrados = todaABaseDeClientes.filter(c => {
            // Recalcula o grupo para o filtro bater
            let totalPedidos = c.total_pedidos || 0;
            let valorTotal = parseFloat(c.valor_total || 0);
            let grupoReal = "PRIMEIRA COMPRA";
            if (totalPedidos > 1) {
                if (valorTotal <= 1000) grupoReal = "BRONZE";
                else if (valorTotal <= 3000) grupoReal = "PRATA";
                else if (valorTotal <= 6000) grupoReal = "OURO";
                else grupoReal = "DIAMANTE";
            }
            return grupoReal === filtro; // Comparação exata
        });
    }

    // Calcula os índices para o corte de 50 itens (Pagination slice)
    const totalItens = dadosFiltrados.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPaginaRelatorio);
    
    // Segurança: se o filtro deixar a página atual sem dados, reseta para 1
    if (paginaAtualRelatorio > totalPaginas && totalPaginas > 0) paginaAtualRelatorio = totalPaginas;

    const inicio = (paginaAtualRelatorio - 1) * itensPorPaginaRelatorio;
    const fim = inicio + itensPorPaginaRelatorio;
    const itensDaPagina = dadosFiltrados.slice(inicio, fim);

    // Desenha as linhas da tabela
    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Nenhum cliente encontrado neste grupo.</td></tr>';
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

    // Atualiza os controles de paginação (Botões e Texto)
    document.getElementById('info-paginacao-ltv').innerText = `Página ${paginaAtualRelatorio} de ${totalPaginas || 1} (${totalItens} total)`;
    document.getElementById('btn-prev-ltv').disabled = (paginaAtualRelatorio === 1);
    document.getElementById('btn-next-ltv').disabled = (paginaAtualRelatorio === totalPaginas || totalPaginas === 0);
}

// 3. CONTROLES: Funções que mudam a página ou o filtro
function mudarPaginaRelatorio(delta) {
    paginaAtualRelatorio += delta;
    renderizarPaginaRelatorio();
}

function resetarEPaginacao() {
    paginaAtualRelatorio = 1; // Reseta para a 1 quando muda o filtro
    renderizarPaginaRelatorio();
}

// O MOTOR DE ORDENAÇÃO (Atualizado para funcionar com paginação)
function ordenarTabela(colunaIndex) {
    if (todaABaseDeClientes.length === 0) return;

    // Inverte a ordem se clicar na mesma coluna
    if (ordemAtualRelatorio.coluna === colunaIndex) {
        ordemAtualRelatorio.crescente = !ordemAtualRelatorio.crescente;
    } else {
        ordemAtualRelatorio.coluna = colunaIndex;
        ordemAtualRelatorio.crescente = false; // Começa sempre do maior para o menor
    }

    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        if (colunaIndex === 6) { // Pedidos
            valA = a.total_pedidos || 0;
            valB = b.total_pedidos || 0;
        } else if (colunaIndex === 7) { // Valor
            valA = parseFloat(a.valor_total || 0);
            valB = parseFloat(b.valor_total || 0);
        }

        if (valA < valB) return ordemAtualRelatorio.crescente ? -1 : 1;
        if (valA > valB) return ordemAtualRelatorio.crescente ? 1 : -1;
        return 0;
    });

    renderizarPaginaRelatorio(); // Re-desenha a página 1 com a nova ordem
}

// SINCRONIZAÇÃO EM LOTES (Mantida)
async function sincronizarTiny() { /* ... mantido ... */ }

// Inicialização da SPA
renderView('login');