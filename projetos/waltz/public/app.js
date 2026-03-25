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

function mostrarSubPaginaDash(subPagina) {
    const contentAreaId = 'dashboard-content-area';
    const titleId = 'dash-page-title';

    document.querySelectorAll('.sidebar .nav-link').forEach(link => link.classList.remove('active'));

    if (subPagina === 'tiny') {
        document.getElementById('nav-tiny').classList.add('active');
        document.getElementById(titleId).innerText = "Base de Clientes (Tiny LTV)";
        
        fetch('/components/relatorio_tiny.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById(contentAreaId).innerHTML = html;
                carregarRelatorioClientes(); // A função que estava faltando!
            });

    } else if (subPagina === 'nuvem') {
        document.getElementById('nav-nuvem').classList.add('active');
        document.getElementById(titleId).innerText = "Monitor de Pedidos Nuvemshop";
        
        fetch('/components/pedidos_nuvem.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById(contentAreaId).innerHTML = html;
            });
    }
}

function loadApp(view) {
    if (view === 'login') {
        // Removemos as linhas do "form", mas MANTEMOS o botão do olhinho da senha!
        document.getElementById('btn-mostrar-senha')?.addEventListener('click', toggleSenha);
    } else if (view === 'painel') {
        // MANTEMOS o carregamento da tabela inicial e o botão de logout!
        mostrarSubPaginaDash('tiny'); 
        document.getElementById('btn-logout')?.addEventListener('click', realizarLogout);
    }
}

// ==========================================
// FUNÇÕES DE LOGIN 
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
// FORMATADORES DE TEXTO (CPF e WhatsApp)
// ==========================================
function formatarDocumento(doc) {
    if (!doc) return '-';
    const num = doc.replace(/\D/g, ''); 
    if (num.length === 11) return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); 
    if (num.length === 14) return num.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"); 
    return doc; 
}

function formatarWhatsAppClicavel(tel) {
    if (!tel || tel === '-') return '-';
    const num = tel.replace(/\D/g, ''); 
    if (num.length < 10) return tel; 
    
    let formatado = tel;
    if (num.length === 11) formatado = `(${num.substring(0,2)}) ${num.substring(2,7)}-${num.substring(7)}`;
    else if (num.length === 10) formatado = `(${num.substring(0,2)}) ${num.substring(2,6)}-${num.substring(6)}`;
    
    return `<a href="https://wa.me/55${num}" target="_blank" class="link-tabela">${formatado}</a>`;
}

// ==========================================
// FUNÇÕES DA BASE TINY (Dados, Selos e Paginação)
// ==========================================

// ESTA ERA A FUNÇÃO QUE ESTAVA FALTANDO E CAUSOU O ERRO!
async function carregarRelatorioClientes() {
    const tbody = document.getElementById('tabela-clientes-body');
    if (!tbody) return; 
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Carregando banco de dados...</td></tr>';
    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const dados = await resposta.json();
        if (dados.sucesso && dados.clientes.length > 0) {
            todaABaseDeClientes = dados.clientes;
            paginaAtualRelatorio = 1; 
            renderizarPaginaRelatorio(); 
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum cliente no banco. Sincronize com o Tiny.</td></tr>';
        }
    } catch (erro) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: red;">Erro de conexão com o banco de dados.</td></tr>'; }
}

function classificarClienteVisual(totalPedidos, valorTotal) {
    if (totalPedidos === 0) return '-'; 
    if (totalPedidos === 1) return '<span class="selo primeira-compra">1ª COMPRA</span>';
    if (valorTotal <= 1000) return '<span class="selo bronze">BRONZE</span>';
    if (valorTotal <= 3000) return '<span class="selo prata">PRATA</span>';
    if (valorTotal <= 6000) return '<span class="selo ouro">OURO</span>';
    return '<span class="selo diamante">DIAMANTE</span>';
}

function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    
    const filtroGrupo = document.getElementById("filtro-grupo") ? document.getElementById("filtro-grupo").value : "TODOS";
    const inputTexto = document.getElementById("filtro-texto");
    const filtroTexto = inputTexto ? inputTexto.value.toLowerCase() : "";
    
    let dadosFiltrados = todaABaseDeClientes;
    
    // 1. Aplica o Filtro de Texto
    if (filtroTexto !== "") {
        dadosFiltrados = dadosFiltrados.filter(c => {
            const nomeStr = (c.nome || "").toLowerCase();
            const cpfStr = (c.cpf || "").toLowerCase();
            return nomeStr.includes(filtroTexto) || cpfStr.includes(filtroTexto);
        });
    }
    
    // 2. Aplica o Filtro de Grupo
    if (filtroGrupo !== "TODOS") {
        dadosFiltrados = dadosFiltrados.filter(c => {
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
            return grupoReal === filtroGrupo; 
        });
    }

    // 3. A MÁGICA DO CONTADOR DE CADASTROS:
    const totalItens = dadosFiltrados.length;
    const contadorElem = document.getElementById('contador-cadastros');
    if (contadorElem) {
        contadorElem.innerText = `${totalItens} cadastro(s)`;
    }

    // 4. Lógica de Paginação Front-end
    const totalPaginas = Math.ceil(totalItens / itensPorPaginaRelatorio);
    if (paginaAtualRelatorio > totalPaginas && totalPaginas > 0) paginaAtualRelatorio = totalPaginas;
    const inicio = (paginaAtualRelatorio - 1) * itensPorPaginaRelatorio;
    const fim = inicio + itensPorPaginaRelatorio;
    const itensDaPagina = dadosFiltrados.slice(inicio, fim);

    // 5. Desenha a Tabela
    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Nenhum cliente encontrado com estes filtros.</td></tr>';
    } else {
        itensDaPagina.forEach(cliente => {
            const valTotalNum = parseFloat(cliente.valor_total || 0);
            const seloHtml = classificarClienteVisual(cliente.total_pedidos || 0, valTotalNum);
            const valorFormatado = valTotalNum.toFixed(2).replace('.', ',');
            
            const cpfFormatado = formatarDocumento(cliente.cpf);
            const wppFormatado = formatarWhatsAppClicavel(cliente.telefone);
            
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${cliente.nome}</td>
                <td style="white-space:nowrap">${wppFormatado}</td>
                <td style="white-space:nowrap">${cpfFormatado}</td>
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

function renderizarControlesPaginacao(totalPaginas) {
    const container = document.getElementById('paginacao-ltv');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    
    let html = `
        <button class="btn-pag-nav" onclick="irParaPaginaRelatorio(1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''} title="Primeira Página">«</button>
        <button class="btn-pag-nav" onclick="mudarPaginaRelatorio(-1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''} title="Página Anterior">‹</button>
    `;
    
    let startPage = Math.max(1, paginaAtualRelatorio - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) { startPage = Math.max(1, endPage - 4); }
    
    for (let i = startPage; i <= endPage; i++) {
        html += (i === paginaAtualRelatorio) 
            ? `<button class="btn-pag-num active">${i}</button>` 
            : `<button class="btn-pag-num" onclick="irParaPaginaRelatorio(${i})">${i}</button>`;
    }
    
    html += `
        <button class="btn-pag-nav" onclick="mudarPaginaRelatorio(1)" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''} title="Próxima Página">›</button>
        <button class="btn-pag-nav" onclick="irParaPaginaRelatorio(${totalPaginas})" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''} title="Última Página">»</button>
    `;
    
    container.innerHTML = html;
}

function mudarPaginaRelatorio(delta) { paginaAtualRelatorio += delta; renderizarPaginaRelatorio(); }
function irParaPaginaRelatorio(pagina) { paginaAtualRelatorio = pagina; renderizarPaginaRelatorio(); }
function resetarEPaginacao() { paginaAtualRelatorio = 1; renderizarPaginaRelatorio(); }

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
            valA = parseInt(a.total_pedidos) || 0;
            valB = parseInt(b.total_pedidos) || 0;
        } else if (colunaIndex === 7) { 
            valA = parseFloat(a.valor_total) || 0;
            valB = parseFloat(b.valor_total) || 0;
        } else { return 0; }

        if (valA < valB) return ordemAtualRelatorio.crescente ? -1 : 1;
        if (valA > valB) return ordemAtualRelatorio.crescente ? 1 : -1;
        return 0;
    });

    const iconPedidos = document.getElementById('sort-icon-6');
    const iconValor = document.getElementById('sort-icon-7');
    if(iconPedidos) iconPedidos.innerText = '↕️';
    if(iconValor) iconValor.innerText = '↕️';

    const iconeAtivo = document.getElementById(`sort-icon-${colunaIndex}`);
    if (iconeAtivo) iconeAtivo.innerText = ordemAtualRelatorio.crescente ? '↑' : '↓';

    resetarEPaginacao(); 
}

// ==========================================
// FUNÇÕES DE SINCRONIZAÇÃO E CÁLCULO
// ==========================================
async function sincronizarTiny() {
    const btn = document.querySelector('.card-header-actions .btn-azul');
    if (!btn) return;
    
    btn.disabled = true;
    const textoOriginal = btn.innerHTML;
    let paginaAtual = 1; 
    let terminou = false;

    while (!terminou) {
        btn.innerHTML = `<span class="material-symbols-outlined">sync</span> Lendo Pág ${paginaAtual}...`;
        try {
            const resposta = await fetch('/api/relatorios/sincronizar-contatos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pagina: paginaAtual })
            });
            const dados = await resposta.json();
            if (dados.sucesso) { 
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
    btn.innerHTML = textoOriginal; 
    btn.disabled = false;
    carregarRelatorioClientes();
}

async function calcularHistoricoMassa() {
    const btn = document.getElementById('btn-calc-massa');
    if (!btn) return;

    const cpfsParaCalcular = todaABaseDeClientes
        .map(cliente => cliente.cpf)
        .filter(cpf => cpf && cpf.length >= 11);

    if (cpfsParaCalcular.length === 0) {
        alert("Nenhum cliente para calcular. Sincronize os contatos primeiro.");
        return;
    }

    const confirmacao = confirm(`Você vai calcular o histórico de ${cpfsParaCalcular.length} clientes. A página não deve ser fechada durante o processo. Deseja iniciar?`);
    if (!confirmacao) return;

    btn.disabled = true;
    let processados = 0;
    const tamanhoLote = 5; 

    for (let i = 0; i < cpfsParaCalcular.length; i += tamanhoLote) {
        const loteDeCpfs = cpfsParaCalcular.slice(i, i + tamanhoLote);
        btn.innerHTML = `<span class="material-symbols-outlined">hourglass_top</span> Calc: ${processados} de ${cpfsParaCalcular.length}...`;

        try {
            await fetch('/api/relatorios/calcular-lote-financeiro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpfs: loteDeCpfs })
            });
            processados += loteDeCpfs.length;
        } catch (e) {
            console.error("Falha leve no lote, continuando...", e);
            processados += loteDeCpfs.length;
        }
    }

    btn.innerHTML = `<span class="material-symbols-outlined">calculate</span> Histórico Atualizado!`;
    btn.disabled = false;
    alert("Cálculo do histórico concluído com sucesso!");
    carregarRelatorioClientes(); 
}

// ==========================================
// FUNÇÕES NUVEMSHOP
// ==========================================
async function buscarPedidosNuvemshop() {
    const btn = document.getElementById('btn-buscar-pedidos');
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!btn || !tbody) return;
    
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined">downloading</span> Buscando...';
    btn.disabled = true;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Conectando com Nuvemshop... Aguarde.</td></tr>';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
        const resposta = await fetch('/api/pedidos', { signal: controller.signal });
        clearTimeout(timeoutId); 
        
        const pedidos = await resposta.json();
        
        if (!resposta.ok || !Array.isArray(pedidos)) throw new Error(pedidos.erro || "Falha de autenticação com a Nuvemshop");

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
                <td>${formatarDocumento(p.customer ? p.customer.identification : '-')}</td>
                <td>${cidade}/${uf}</td>
                <td>${p.shipping_option || '-'}</td>
                <td>${p.shipping_tracking_number || '-'}</td>
                <td>${statusPt}</td>
                <td style="text-align:center;"><span class="selo status-wpp-pendente">Aguardando Feedback</span></td>
            `;
            tbody.appendChild(linha);
        });
    } catch (e) { 
        if (e.name === 'AbortError') {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">A conexão demorou muito (Timeout). Tente novamente.</td></tr>';
        } else {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;"><b>Erro:</b> ${e.message}</td></tr>`;
        }
    } finally { 
        btn.innerHTML = textoOriginal; 
        btn.disabled = false; 
    }
}

// ==========================================
// INICIALIZAÇÃO INTELIGENTE DA APLICAÇÃO
// ==========================================
async function inicializarApp() {
    // 1. BLINDAGEM DE URL: Se a URL estiver suja (com ?usuario=...), nós limpamos ela da barra de endereços
    if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. VERIFICAÇÃO DE SESSÃO: Pergunta ao servidor se o usuário já fez login antes
    try {
        const resposta = await fetch('/api/check-session');
        const dados = await resposta.json();
        
        if (dados.logado) {
            // Se o servidor disser que sim, pula direto para o painel!
            renderView('painel');
        } else {
            // Se não, mostra a tela de login
            renderView('login');
        }
    } catch (erro) {
        // Em caso de erro na internet, mostra o login por segurança
        renderView('login');
    }
}

// Dispara a função assim que o script carrega
inicializarApp();