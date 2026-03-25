// ==========================================
// CONFIGURAÇÃO GERAL E ROTEAMENTO SPA
// ==========================================

let todaABaseDeClientes = []; 
let paginaAtualRelatorio = 1;
let itensPorPaginaRelatorio = 50;
let ordemAtualRelatorio = { coluna: -1, crescente: true };

function renderView(view, targetId = 'app') {
    fetch(`/components/${view}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById(targetId).innerHTML = html;
            loadApp(view); 
        })
        .catch(err => console.error('Erro ao carregar view:', err));
}

function loadApp(view) {
    if (view === 'login') {
        const form = document.getElementById('form-login');
        if (form) form.addEventListener('submit', realizarLogin);
        const btnMostrar = document.getElementById('btn-mostrar-senha');
        if (btnMostrar) btnMostrar.addEventListener('click', toggleSenha);
    } else if (view === 'painel') {
        carregarRelatorioClientes(); 
        document.getElementById('btn-logout')?.addEventListener('click', realizarLogout);
        
        // Liga o botão da Nuvemshop
        document.getElementById('btn-buscar-pedidos')?.addEventListener('click', buscarPedidosNuvemshop);
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
        else { msgErro.style.display = 'block'; btnSubmit.innerText = "Entrar no Sistema"; btnSubmit.disabled = false; }
    } catch (e) {
        msgErro.innerText = "Erro ao conectar."; msgErro.style.display = 'block';
        btnSubmit.innerText = "Entrar no Sistema"; btnSubmit.disabled = false;
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
// FUNÇÕES DA BASE TINY (Selo Corrigido)
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
    } catch (erro) { tbody.innerHTML = '<tr><td colspan="8">Erro ao conectar com o servidor.</td></tr>'; }
}

function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    const filtro = document.getElementById("filtro-grupo").value;
    
    let dadosFiltrados = todaABaseDeClientes;
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
    renderizarControlesPaginacao(totalPaginas);
}

// --- A NOVA PAGINAÇÃO EM BLOQUINHOS ---
function renderizarControlesPaginacao(totalPaginas) {
    const container = document.getElementById('paginacao-ltv');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="btn-pag-nav" onclick="mudarPaginaRelatorio(-1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''}>«</button>`;

    // Lógica para mostrar no máximo 5 botões ao redor da página atual
    let startPage = Math.max(1, paginaAtualRelatorio - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) { startPage = Math.max(1, endPage - 4); }

    for (let i = startPage; i <= endPage; i++) {
        if (i === paginaAtualRelatorio) {
            html += `<button class="btn-pag-num active">${i}</button>`;
        } else {
            html += `<button class="btn-pag-num" onclick="irParaPaginaRelatorio(${i})">${i}</button>`;
        }
    }

    html += `<button class="btn-pag-nav" onclick="mudarPaginaRelatorio(1)" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''}>»</button>`;
    container.innerHTML = html;
}

function mudarPaginaRelatorio(delta) {
    paginaAtualRelatorio += delta;
    renderizarPaginaRelatorio();
}

function irParaPaginaRelatorio(pagina) {
    paginaAtualRelatorio = pagina;
    renderizarPaginaRelatorio();
}

function resetarEPaginacao() {
    paginaAtualRelatorio = 1; 
    renderizarPaginaRelatorio();
}

function ordenarTabela(colunaIndex) {
    if (todaABaseDeClientes.length === 0) return;
    if (ordemAtualRelatorio.coluna === colunaIndex) { ordemAtualRelatorio.crescente = !ordemAtualRelatorio.crescente; } 
    else { ordemAtualRelatorio.coluna = colunaIndex; ordemAtualRelatorio.crescente = false; }

    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        if (colunaIndex === 6) { valA = a.total_pedidos || 0; valB = b.total_pedidos || 0; } 
        else if (colunaIndex === 7) { valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); }
        if (valA < valB) return ordemAtualRelatorio.crescente ? -1 : 1;
        if (valA > valB) return ordemAtualRelatorio.crescente ? 1 : -1;
        return 0;
    });
    renderizarPaginaRelatorio(); 
}

async function sincronizarTiny() {
    const btn = event.target; btn.disabled = true;
    let paginaAtual = 1; let terminou = false;

    while (!terminou) {
        btn.innerText = `🔄 Sincronizando (Pág ${paginaAtual})...`;
        try {
            const resposta = await fetch('/api/relatorios/sincronizar-contatos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pagina: paginaAtual })
            });
            const dados = await resposta.json();
            if (dados.sucesso) { paginaAtual = dados.proximaPagina; terminou = dados.concluiu; } 
            else { alert("Erro ao sincronizar."); terminou = true; }
        } catch (erro) { alert("Erro de conexão."); terminou = true; }
    }
    btn.innerText = '🔄 Atualizar Dados com Tiny'; btn.disabled = false;
    carregarRelatorioClientes();
}

// ==========================================
// FUNÇÕES DE PEDIDOS NUVEMSHOP (NOVO)
// ==========================================
async function buscarPedidosNuvemshop() {
    const btn = document.getElementById('btn-buscar-pedidos');
    const tbody = document.getElementById('corpo-tabela-nuvem');
    
    btn.textContent = '📥 Buscando...';
    btn.disabled = true;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Conectando com a Nuvemshop...</td></tr>';

    try {
        const resposta = await fetch('/api/pedidos');
        if (!resposta.ok) throw new Error("Erro na API");
        const pedidos = await resposta.json();

        tbody.innerHTML = '';
        
        if(pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum pedido recente encontrado.</td></tr>';
            return;
        }

        pedidos.forEach(p => {
            // Formatar Data
            const dataObjeto = new Date(p.created_at);
            const dataFormatada = dataObjeto.toLocaleDateString('pt-BR') + ' ' + dataObjeto.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            
            // Dados de Cliente e Endereço com proteção contra nulos
            const clienteNome = p.customer ? p.customer.name : '-';
            const clienteCpf = p.customer ? p.customer.identification : '-';
            const cidade = p.shipping_address ? p.shipping_address.city : '-';
            const uf = p.shipping_address ? p.shipping_address.province : '-';
            
            // Logística
            const transportadora = p.shipping_option || '-';
            const rastreio = p.shipping_tracking_number || '-';
            
            // Mapeando Status da Nuvemshop para Português
            let statusPt = p.status;
            if (p.status === 'open') statusPt = 'Aberto';
            if (p.status === 'closed') statusPt = 'Fechado / Arquivado';
            if (p.status === 'canceled') statusPt = 'Cancelado';

            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td style="white-space:nowrap">${dataFormatada}</td>
                <td style="font-weight:bold; color:#2563eb;">#${p.number}</td>
                <td>${clienteNome}</td>
                <td>${clienteCpf}</td>
                <td>${cidade}/${uf}</td>
                <td>${transportadora}</td>
                <td>${rastreio}</td>
                <td>${statusPt}</td>
                <td style="text-align:center;"><span class="selo pendente">Aguardando WPP</span></td>
            `;
            tbody.appendChild(linha);
        });
    } catch (erro) {
        console.error(erro);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Erro ao puxar dados da Nuvemshop.</td></tr>';
    } finally {
        btn.textContent = '📥 Buscar Últimos Pedidos';
        btn.disabled = false;
    }
}

// INICIALIZAÇÃO
renderView('login');