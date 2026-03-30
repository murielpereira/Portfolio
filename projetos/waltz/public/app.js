function inicializarIcones() {
    const scriptLucide = document.createElement('script');
    scriptLucide.src = 'https://unpkg.com/lucide@latest';
    scriptLucide.onload = () => { if (window.lucide) window.lucide.createIcons(); };
    document.head.appendChild(scriptLucide);
}
inicializarIcones();
function atualizarIcones() { if (window.lucide) window.lucide.createIcons(); }

let isGoogleChartsReady = false;

function inicializarGoogleCharts() {
    const scriptGoogle = document.createElement('script');
    scriptGoogle.src = 'https://www.gstatic.com/charts/loader.js';
    scriptGoogle.onload = () => {
        try {
            google.charts.load('current', { 'packages': ['geochart', 'corechart'], 'language': 'pt-br' });
            google.charts.setOnLoadCallback(() => {
                isGoogleChartsReady = true;
                const abaCep = document.getElementById('sub-cep');
                if (abaCep && abaCep.style.display === 'block') renderizarTabelaCEPs();
            });
        } catch (e) { console.error(e); }
    };
    document.head.appendChild(scriptGoogle);
}
inicializarGoogleCharts();

function formatarDocumento(doc) {
    if (!doc) return '-';
    const num = doc.replace(/\D/g, '');
    if (num.length === 11) return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (num.length === 14) return num.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return doc;
}

function formatarWhatsAppClicavel(telefone) {
    if (!telefone) return '-';
    const num = telefone.replace(/\D/g, '');
    if (num.length < 10) return telefone;
    let ddd = num.substring(0, 2); let resto = num.substring(2);
    let link = `https://wa.me/55${num}`;
    let txt = `(${ddd}) ${resto.length === 9 ? resto.substring(0, 5) + '-' + resto.substring(5) : resto.substring(0, 4) + '-' + resto.substring(4)}`;
    return `<a href="${link}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">${txt}</a>`;
}

function toggleSenha() {
    const input = document.getElementById('senha');
    const icone = document.getElementById('icone-senha');
    if (input && icone) {
        if (input.type === 'password') { input.type = 'text'; icone.innerText = 'visibility_off'; } 
        else { input.type = 'password'; icone.innerText = 'visibility'; }
    }
}

// ============================================================================
// TEMPLATES HTML
// ============================================================================
function getTemplateLogin() {
    return `
    <div class="login-bg">
        <div class="glass-card">
            <div style="text-align: center; margin-bottom: 30px;">
                <!-- Correção do caminho da Logo -->
                <img src="./logo.png" alt="Waltz" style="height: 50px; margin-bottom: 15px; border-radius: 8px; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
                <p style="color: #e2e8f0; font-size: 14px; margin: 0;">Acesse sua conta para continuar</p>
            </div>
            <form id="form-login">
                <div style="margin-bottom: 20px;">
                    <label for="usuario" style="display: block; margin-bottom: 8px; font-weight: 600; color: #f8fafc; font-size: 13px;">E-mail</label>
                    <input type="text" id="usuario" name="usuario" placeholder="seu@email.com" class="glass-input" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="senha" style="display: block; margin-bottom: 8px; font-weight: 600; color: #f8fafc; font-size: 13px;">Senha</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="senha" name="senha" placeholder="••••••••" class="glass-input" required>
                        <button type="button" id="btn-mostrar-senha" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #cbd5e1; display: flex;"><span class="material-symbols-outlined" id="icone-senha" style="font-size: 20px;">visibility</span></button>
                    </div>
                </div>
                <div style="text-align: right; margin-bottom: 30px;"><a href="#" style="color: #cbd5e1; font-size: 13px; text-decoration: none;">Esqueceu a senha?</a></div>
                <button type="submit" id="btn-login-submit" class="glass-btn">Entrar</button>
            </form>
        </div>
    </div>`;
}

function getTemplatePainel() {
    return `
    <div class="dashboard-wrapper">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <!-- Correção do caminho da Logo. A imagem não tem mais invert para o fundo limpo. -->
                <img src="./logo.png" alt="Waltz" style="border-radius:4px; max-height: 40px;"> 
                <div class="btn-toggle-menu" onclick="toggleSidebar()"><i data-lucide="chevron-left"></i></div>
            </div>
            <ul class="nav-links">
                <li><div id="nav-dash" class="nav-link" onclick="mostrarSubPaginaDash('dash')"><i data-lucide="layout-dashboard"></i> <span class="nav-text">Dashboard</span></div></li>
                <li><div id="nav-tiny" class="nav-link" onclick="mostrarSubPaginaDash('tiny')"><i data-lucide="users"></i> <span class="nav-text">Clientes</span></div></li>
                <li><div id="nav-nuvem" class="nav-link" onclick="mostrarSubPaginaDash('nuvem')"><i data-lucide="shopping-cart"></i> <span class="nav-text">Pedidos</span></div></li>
                <li><div class="nav-link"><i data-lucide="truck"></i> <span class="nav-text">Entregas</span></div></li>
                <li><div class="nav-link"><i data-lucide="mail"></i> <span class="nav-text">E-mail</span></div></li>
                <li><div class="nav-link"><i data-lucide="message-circle"></i> <span class="nav-text">WhatsApp</span></div></li>
                <li><div id="nav-rfm" class="nav-link" onclick="mostrarSubPaginaDash('rfm')"><i data-lucide="bar-chart-2"></i> <span class="nav-text">Matriz RFM</span></div></li>
                <li><div id="nav-cep" class="nav-link" onclick="mostrarSubPaginaDash('cep')"><i data-lucide="map"></i> <span class="nav-text">Regiões Logísticas</span></div></li>
            </ul>
            <div class="sidebar-footer">
                <div class="nav-link"><i data-lucide="settings"></i> <span class="nav-text">Configurações</span></div>
                <div class="nav-link" id="btn-logout"><i data-lucide="log-out"></i> <span class="nav-text">Sair</span></div>
            </div>
        </aside>

        <main class="main-content">
            <header class="topbar">
                <div class="page-title-area">
                    <h1 id="dash-page-title">Dashboard</h1>
                    <p id="dash-page-subtitle">Visão geral do seu e-commerce</p>
                </div>
                <div id="dynamic-top-actions" class="table-top-actions"></div>
            </header>

            <div class="page-content-wrapper" id="dashboard-content-area">
                <!-- (DASHBOARD OMITIDO PARA BREVIDADE, MAS INCLUÍDO NO CÓDIGO) -->
                <div id="sub-dash" class="sub-pagina" style="display: none;">
                    <div class="kpi-grid">
                        <div class="kpi-card"><div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;"><i data-lucide="users"></i></div><div class="kpi-info"><h3>Clientes</h3><div class="value">27.935</div></div></div>
                        <div class="kpi-card"><div class="kpi-icon" style="background:#ecfdf5; color:#10b981;"><i data-lucide="shopping-cart"></i></div><div class="kpi-info"><h3>Pedidos</h3><div class="value">7.485</div></div></div>
                        <div class="kpi-card"><div class="kpi-icon" style="background:#fffbeb; color:#f59e0b;"><i data-lucide="truck"></i></div><div class="kpi-info"><h3>Entregas Pendentes</h3><div class="value">342</div></div></div>
                        <div class="kpi-card"><div class="kpi-icon" style="background:#fef2f2; color:#ef4444;"><i data-lucide="mail"></i></div><div class="kpi-info"><h3>E-mails Enviados</h3><div class="value">1.204</div></div></div>
                    </div>
                    <div class="charts-grid">
                        <div class="chart-card" id="grafico-clientes-div" style="padding: 20px; align-items: center;">Carregando gráfico...</div>
                        <div class="chart-card">Desempenho logístico — em breve</div>
                    </div>
                </div>

                <div id="sub-tiny" class="sub-pagina" style="display: none;">
                    <div class="card-table">
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                               <thead>
                                    <tr>
                                        <th onclick="ordenarTabela(0)">Nome <span class="sort-icon" id="sort-icon-0">↑↓</span></th>
                                        <th onclick="ordenarTabela(1)">WhatsApp <span class="sort-icon" id="sort-icon-1">↑↓</span></th>
                                        <th onclick="ordenarTabela(2)">CPF/CNPJ <span class="sort-icon" id="sort-icon-2">↑↓</span></th>
                                        <th onclick="ordenarTabela(3)">Cidade <span class="sort-icon" id="sort-icon-3">↑↓</span></th>
                                        <th onclick="ordenarTabela(4)">UF <span class="sort-icon" id="sort-icon-4">↑↓</span></th>
                                        <th onclick="ordenarTabela(5)">Grupo <span class="sort-icon" id="sort-icon-5">↑↓</span></th> 
                                        <th onclick="ordenarTabela(6)">Pedidos <span class="sort-icon" id="sort-icon-6">↑↓</span></th>
                                        <th onclick="ordenarTabela(7)">Ticket Médio <span class="sort-icon" id="sort-icon-7">↑↓</span></th>
                                        <th onclick="ordenarTabela(8)">Entrega <span class="sort-icon" id="sort-icon-8">↑↓</span></th>
                                        <th onclick="ordenarTabela(9)">Valor Total <span class="sort-icon" id="sort-icon-9">↑↓</span></th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-clientes-body"><tr><td colspan="10" style="text-align:center; padding: 30px;">Carregando...</td></tr></tbody>
                            </table>
                        </div>
                        <div class="paginacao-controles" id="paginacao-ltv"></div>
                    </div>
                </div>

                <div id="sub-nuvem" class="sub-pagina" style="display: none;">
                    <div class="card-table">
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                                <thead>
                                    <tr>
                                        <th>Data/Hora <span class="sort-icon">↑↓</span></th>
                                        <th>Pedido <span class="sort-icon">↑↓</span></th>
                                        <th>Cliente <span class="sort-icon">↑↓</span></th>
                                        <th>Status <span class="sort-icon">↑↓</span></th>
                                        <th>Automações (Status WhatsApp)</th>
                                    </tr>
                                </thead>
                                <tbody id="corpo-tabela-nuvem"><tr><td colspan="5" style="text-align: center; padding: 30px;">Carregando...</td></tr></tbody>
                            </table>
                        </div>
                        <div class="paginacao-controles" id="paginacao-nuvem"></div>
                    </div>
                </div>

                <div id="sub-rfm" class="sub-pagina" style="display: none;">
                    <div class="card-table" style="padding: 30px; text-align: center;">
                        <div style="width: 60px; height: 60px; background: #eff6ff; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i data-lucide="target" style="width: 30px; height: 30px;"></i>
                        </div>
                        <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 10px;">Matriz RFM Inteligente</h2>
                        <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 30px;">
                            A análise de <b>Recência</b> (tempo desde a última compra), <b>Frequência</b> (quantidade de compras) e <b>Monetário</b> (valor gasto) divide a sua base para ações de marketing precisas.
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; max-width: 800px; margin: 0 auto 30px;">
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="font-size: 24px; font-weight: bold; color: var(--primary);" id="rfm-r-avg">-</div>
                                <b>Recência Média</b> <br><span style="font-size:12px; color:var(--text-muted)">Dias desde a última compra</span>
                            </div>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="font-size: 24px; font-weight: bold; color: #10b981;" id="rfm-f-avg">-</div>
                                <b>Frequência Média</b> <br><span style="font-size:12px; color:var(--text-muted)">Total de pedidos por cliente</span>
                            </div>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;" id="rfm-m-avg">-</div>
                                <b>LTV Médio</b> <br><span style="font-size:12px; color:var(--text-muted)">Gasto total por cliente</span>
                            </div>
                        </div>
                        <div style="max-width: 800px; margin: 0 auto; text-align: left;" id="rfm-segmentos">
                            <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-diamante">Campeões</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Compraram recentemente, compram com frequência e gastam muito.</span></div>
                                <strong id="rfm-campeoes">0 clientes</strong>
                            </div>
                            <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-ouro">Fiéis</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Compram com frequência regular na sua loja.</span></div>
                                <strong id="rfm-fieis">0 clientes</strong>
                            </div>
                            <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-primeiracompra">Recentes</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Fizeram a primeira compra nos últimos 30 dias.</span></div>
                                <strong id="rfm-recentes">0 clientes</strong>
                            </div>
                            <div style="padding: 15px; display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-bronze">Em Risco</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Compraram no passado, mas estão sumidos há muito tempo.</span></div>
                                <strong id="rfm-emrisco">0 clientes</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="sub-cep" class="sub-pagina" style="display: none;">
                    <section id="mapa_brasil_card" class="card" style="display:none; padding: 20px; margin-bottom: 20px; background:white; border-radius:12px; border:1px solid var(--border-color);">
                        <h2 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Visualização Geográfica (Heatmap de Entrega)</h2>
                        <div style="display: flex; justify-content: center; align-items: center; background: #f8fafc; border-radius: 8px; padding: 10px;"><div id="mapa_brasil_div" style="width: 100%; max-width: 650px; height: 350px;"></div></div>
                    </section>
                    <div class="card-table">
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                                <thead><tr><th>Estado (UF)</th><th>CEP Base</th><th>Média de Tempo de Entrega</th><th>Volume (Qtd de Pedidos)</th></tr></thead>
                                <tbody id="corpo-tabela-ceps"><tr><td colspan="4" style="text-align: center; padding: 30px;">Aguardando processamento...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DRAWER DE DETALHES DO PEDIDO -->
            <div class="drawer-overlay" id="drawer-overlay" onclick="fecharDetalhesPedido()"></div>
            <div class="drawer-panel" id="drawer-pedido">
                <div class="drawer-header">
                    <h2 id="drawer-titulo">Detalhes do Pedido</h2>
                    <button class="btn-close-drawer" onclick="fecharDetalhesPedido()"><i data-lucide="x"></i></button>
                </div>
                <div class="drawer-body" id="drawer-conteudo">
                    <!-- Conteúdo injetado pelo JavaScript -->
                </div>
            </div>

        </main>
    </div>`;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

document.addEventListener('DOMContentLoaded', async () => { await inicializarApp(); });

async function inicializarApp() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;
    try {
        const resposta = await fetch('/api/check-session');
        const dados = await resposta.json();
        if (dados.logado) {
            appDiv.innerHTML = getTemplatePainel();
            document.getElementById('btn-logout')?.addEventListener('click', realizarLogout);
            mostrarSubPaginaDash('tiny'); 
        } else {
            appDiv.innerHTML = getTemplateLogin();
            document.getElementById('form-login')?.addEventListener('submit', realizarLogin);
            document.getElementById('btn-mostrar-senha')?.addEventListener('click', toggleSenha);
        }
    } catch (erro) { appDiv.innerHTML = '<p style="text-align:center; padding:50px;">Erro de conexão. Atualize a página.</p>'; }
}

async function realizarLogin(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuario')?.value;
    const senha = document.getElementById('senha')?.value;
    try {
        const resposta = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario, senha }) });
        const dados = await resposta.json();
        if (dados.sucesso) window.location.reload(); 
        else alert('Usuário ou senha incorretos!');
    } catch (erro) { alert('Erro ao conectar.'); } 
}

async function realizarLogout() {
    try { await fetch('/api/logout'); window.location.reload(); } catch (erro) {}
}

async function mostrarSubPaginaDash(idAlvo) {
    document.querySelectorAll('.sub-pagina').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    const painelAlvo = document.getElementById(`sub-${idAlvo}`);
    const menuAlvo = document.getElementById(`nav-${idAlvo}`);
    const topActions = document.getElementById('dynamic-top-actions');
    
    if (painelAlvo) painelAlvo.style.display = 'block';
    if (menuAlvo) menuAlvo.classList.add('active');
    if (topActions) topActions.innerHTML = ''; 

    if (idAlvo === 'dash') {
        document.getElementById('dash-page-title').innerText = "Dashboard";
        document.getElementById('dash-page-subtitle').innerText = "Visão geral do seu e-commerce";
        if (todaABaseDeClientes.length === 0) await carregarClientesTinyDB();
        renderizarGraficoClientes(); 
    } else if (idAlvo === 'tiny') {
        document.getElementById('dash-page-title').innerText = "Clientes";
        document.getElementById('dash-page-subtitle').innerText = "Listagem de cadastros";
        topActions.innerHTML = `
            <div class="search-bar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" id="filtro-texto" placeholder="Buscar por nome ou CPF..." onkeyup="resetarEPaginacao()"></div>
            <select id="filtro-grupo" class="select-modern" onchange="resetarEPaginacao()">
                <option value="TODOS">Todos os Grupos</option><option value="DIAMANTE">Diamante</option><option value="OURO">Ouro</option><option value="PRATA">Prata</option><option value="BRONZE">Bronze</option><option value="PRIMEIRA COMPRA">1ª Compra</option><option value="SEM COMPRAS">Sem Compras</option>
            </select>
            <span id="contador-cadastros" class="contador-badge">0 cadastro(s)</span>
        `;
        await carregarClientesTinyDB();
    } else if (idAlvo === 'nuvem') {
        document.getElementById('dash-page-title').innerText = "Pedidos";
        document.getElementById('dash-page-subtitle').innerText = "Listagem de vendas";
        // OPÇÃO "ENVIADO" INCLUÍDA
        topActions.innerHTML = `
            <div class="search-bar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" id="busca-nuvem" placeholder="Buscar pedido ou cliente..." onkeyup="resetarPaginacaoNuvem()"></div>
            <select id="filtro-status-nuvem" class="select-modern" onchange="resetarPaginacaoNuvem()">
                <option value="TODOS">Todos os Status</option>
                <option value="Aberto">Aberto</option>
                <option value="Enviado">Enviado</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
            </select>
            <span id="contador-nuvem" class="contador-badge">0 pedido(s)</span>
        `;
        await carregarPedidosNuvemDB();
    } else if (idAlvo === 'rfm') {
        document.getElementById('dash-page-title').innerText = "Matriz RFM";
        document.getElementById('dash-page-subtitle').innerText = "Inteligência de Segmentação";
        if (todaABaseDeClientes.length === 0) await carregarClientesTinyDB();
        renderizarMatrizRFM(); 
    } else if (idAlvo === 'cep') { 
        document.getElementById('dash-page-title').innerText = "Desempenho Logístico por Região";
        document.getElementById('dash-page-subtitle').innerText = "Análise de tempo de entrega";
        topActions.innerHTML = `<div class="search-bar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" id="busca-cep-analise" placeholder="Filtrar por CEP..." onkeyup="renderizarTabelaCEPs()"></div>`;
        if (todosOsPedidosNuvem.length === 0) await carregarPedidosNuvemDB(); 
        renderizarTabelaCEPs();
    }
    atualizarIcones();
}

// ==========================================
// FUNÇÕES DO PEDIDO E GAVETA (DRAWER)
// ==========================================
let todosOsPedidosNuvem = [];
let paginaAtualNuvem = 1;
const itensPorPaginaNuvem = 50;

async function carregarPedidosNuvemDB() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Carregando pedidos...</td></tr>';
    try {
        const resposta = await fetch('/api/pedidos');
        todosOsPedidosNuvem = await resposta.json();
        resetarPaginacaoNuvem();
    } catch (e) {}
}

function renderizarPaginaNuvem() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    
    const termoBusca = (document.getElementById("busca-nuvem")?.value || "").toLowerCase();
    const filtroStatus = document.getElementById("filtro-status-nuvem")?.value || "TODOS";
    
    let dadosFiltrados = todosOsPedidosNuvem.filter(p => {
        const passaBusca = termoBusca === "" || (p.numero_pedido || "").toLowerCase().includes(termoBusca) || (p.nome_cliente || "").toLowerCase().includes(termoBusca);
        const passaStatus = filtroStatus === "TODOS" || p.status_nuvemshop === filtroStatus;
        return passaBusca && passaStatus;
    });

    const contadorElem = document.getElementById('contador-nuvem');
    if (contadorElem) contadorElem.innerText = `${dadosFiltrados.length} pedido(s)`;

    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPaginaNuvem);
    if (paginaAtualNuvem > totalPaginas && totalPaginas > 0) paginaAtualNuvem = totalPaginas;
    const inicio = (paginaAtualNuvem - 1) * itensPorPaginaNuvem;
    const itensDaPagina = dadosFiltrados.slice(inicio, inicio + itensPorPaginaNuvem);

    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhum pedido atende aos filtros.</td></tr>';
    } else {
        itensDaPagina.forEach(p => {
            const dataO = new Date(p.data_criacao);
            const dataF = dataO.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' ' + dataO.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' });
            
            const stNuvem = (p.status_nuvemshop || '').toUpperCase();

            // LÓGICA DO PROGRESSO (Qual foi a última etapa enviada?)
            let step = 0;
            let ultimoStatusTexto = "Aguardando...";
            
            if (p.auto_aprovado === true) { step = 1; ultimoStatusTexto = "1. Pedido Aprovado"; }
            if (p.auto_fabricacao === true) { step = 2; ultimoStatusTexto = "2. Em Fabricação"; }
            if (p.auto_rastreio === true) { step = 3; ultimoStatusTexto = "3. Rastreio Enviado"; }
            if (p.auto_entrega === true) { step = 4; ultimoStatusTexto = "4. Em Rota / Entregue"; }
            if (p.status_feedback === 'Enviado') { step = 5; ultimoStatusTexto = "5. Feedback Concluído"; }

            // HTML da Célula de Automação (Agora super Clean)
            let corTexto = step > 0 ? 'var(--primary)' : 'var(--text-muted)';
            let acaoComunicacao = `<span style="font-size: 13px; font-weight: 600; color: ${corTexto};">${ultimoStatusTexto}</span>`;
            
            // 👇 CORREÇÃO AQUI: Aplicação dinâmica da cor da Badge
            let corBadge = 'badge-aberto';
            if (stNuvem === 'ENTREGUE') corBadge = 'badge-entregue';
            else if (stNuvem === 'ENVIADO') corBadge = 'badge-ouro';
            else if (stNuvem === 'CANCELADO') corBadge = 'badge-semcompra';
            
            let statusBadge = `<span class="badge ${corBadge}">${stNuvem}</span>`;
            
            const linha = document.createElement('tr');
            linha.onclick = () => abrirDetalhesPedido(p.id_pedido);
            linha.innerHTML = `
                <td style="white-space:nowrap; color: var(--text-muted);">${dataF}</td>
                <td style="font-weight:600; color:var(--primary);">#${p.numero_pedido}</td>
                <td style="font-weight:500;">${p.nome_cliente || '-'}</td>
                <td>${statusBadge}</td> <!-- Variável corrigida inserida aqui -->
                <td>${acaoComunicacao}</td>
            `;
            tbody.appendChild(linha);
        });
    }
    renderizarControlesPaginacaoNuvem(totalPaginas);
    atualizarIcones(); 
}

function abrirDetalhesPedido(idPedido) {
    const pedido = todosOsPedidosNuvem.find(p => p.id_pedido === idPedido);
    if (!pedido) return;

    document.getElementById('drawer-titulo').innerText = `Pedido #${pedido.numero_pedido}`;

    // NOVA MATEMÁTICA LOGÍSTICA (Ignora horas, subtrai dias do calendário)
    let tempoTexto = 'Aguardando envio';
    if (pedido.data_envio && pedido.data_entrega) {
        const d1 = new Date(pedido.data_envio);
        const d2 = new Date(pedido.data_entrega);
        
        // Converte as datas para as 00:00:00 (Fuso horário universal) para comparar perfeitamente
        const data1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
        const data2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
        
        const diffDias = Math.floor((data2 - data1) / (1000 * 60 * 60 * 24));
        
        if (diffDias === 0) tempoTexto = 'Entregue no mesmo dia';
        else tempoTexto = `${diffDias} dia(s)`;
    } else if (pedido.data_envio) {
        tempoTexto = 'Em andamento';
    }

    const telLimpo = (pedido.telefone || '').replace(/\D/g, '');
    const urlWpp = `https://wa.me/55${telLimpo}`;

    // LÓGICA MATEMÁTICA DA BARRA DE PROGRESSO
    // 4. LÓGICA MATEMÁTICA DO STEPPER VERTICAL
    let step = 0;
    if (pedido.auto_aprovado === true) step = 1;
    if (pedido.auto_fabricacao === true) step = 2;
    if (pedido.auto_rastreio === true) step = 3;
    if (pedido.auto_entrega === true) step = 4;
    if (pedido.status_feedback === 'Enviado') step = 5;

    const createStep = (isDone, title, subtitle) => {
        const color = isDone ? '#10b981' : '#cbd5e1';
        const bg = isDone ? '#10b981' : 'white';
        const icon = isDone ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ``;
        return `
        <div style="display:flex; gap:12px; align-items:center; z-index:3; position:relative; background:white; padding:4px 0;">
            <div style="width:24px; height:24px; border-radius:50%; border:2px solid ${color}; background:${bg}; display:flex; align-items:center; justify-content:center;">${icon}</div>
            <div style="display:flex; flex-direction:column;">
                <span style="font-size:13px; font-weight:700; color:var(--text-main);">${title}</span>
                <span style="font-size:11px; color:var(--text-muted);">${subtitle}</span>
            </div>
        </div>`;
    };

    // Calcula a porcentagem (0%, 20%, 40%, 60%, 80% ou 100%)
    let progressPct = (step / 5) * 100;

    const conteudo = document.getElementById('drawer-conteudo');
    conteudo.innerHTML = `
        <div class="detail-header-card">
            <div class="detail-avatar"><i data-lucide="user"></i></div>
            <div class="detail-header-info" style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${pedido.nome_cliente || '-'}</h3>
                </div>
                <p style="margin-top:5px;"><i data-lucide="phone" style="width:12px; height:12px;"></i> ${pedido.telefone || 'Sem telefone'}</p>
                <p><i data-lucide="mail" style="width:12px; height:12px;"></i> ${pedido.email_cliente || 'Sem e-mail'}</p>
            </div>
        </div>

        <!-- CONTATO RÁPIDO -->
        <div class="detail-group">
            <label>Contato Rápido</label>
            <a href="${urlWpp}" target="_blank" style="display:inline-flex; align-items:center; gap:8px; background:#25d366; color:white; padding:8px 15px; border-radius:8px; text-decoration:none; font-weight:600; font-size:13px; transition: background 0.2s;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Chamar no WhatsApp
            </a>
        </div>

        <!-- STEPPER VERTICAL (LINHA DO TEMPO) -->
        <div class="detail-group" style="margin-bottom: 30px; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid var(--border-color);">
            <label>Progresso das Automações WPP</label>
            <div style="position:relative; display:flex; flex-direction:column; gap:15px; margin-top:15px;">
                <div style="position:absolute; left:11px; top:10px; bottom:10px; width:2px; background:var(--border-color); z-index:1;"></div>
                <div style="position:absolute; left:11px; top:10px; height:${(step/4)*100}%; max-height:100%; width:2px; background:#10b981; z-index:2; transition:height 0.8s ease-in-out;"></div>
                
                ${createStep(step >= 1, "1. Pedido Aprovado", "Confirmação do pagamento")}
                ${createStep(step >= 2, "2. Em Fabricação", "Peça entrou em produção")}
                ${createStep(step >= 3, "3. Código de Rastreio", "Envio do link da transportadora")}
                ${createStep(step >= 4, "4. Rota de Entrega", "Aviso de entrega no dia")}
                ${createStep(step >= 5, "5. Feedback", "Pesquisa de satisfação")}
            </div>
        </div>

        <div class="detail-group"><label>Documento (CPF/CNPJ)</label><p>${formatarDocumento(pedido.cpf_cliente || '-')}</p></div>
        
        <div class="detail-group">
            <label>Endereço de Entrega</label>
            <p>${pedido.endereco_completo || 'Endereço não capturado'}</p>
            <p style="color:var(--text-muted); font-size:13px; margin-top:2px;">${pedido.cidade || '-'} - ${pedido.estado || '-'} (${pedido.cep || 'Sem CEP'})</p>
        </div>

        <div class="detail-group"><label>Transportadora</label><p>${pedido.transportadora || '-'}</p></div>
        <div class="detail-group"><label>Código de Rastreio</label><p style="font-family: monospace; color: var(--primary); font-weight: 600; font-size: 15px;">${pedido.rastreio || 'Aguardando envio...'}</p></div>
        <div class="detail-group"><label>Tempo de Entrega Logístico</label><p>${tempoTexto}</p></div>
    `;

    document.getElementById('drawer-overlay').classList.add('active');
    document.getElementById('drawer-pedido').classList.add('active');
    atualizarIcones();
}

function fecharDetalhesPedido() {
    document.getElementById('drawer-overlay').classList.remove('active');
    document.getElementById('drawer-pedido').classList.remove('active');
}

function renderizarControlesPaginacaoNuvem(totalPaginas) {
    const container = document.getElementById('paginacao-nuvem');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    let html = `<button class="btn-pag-nav" onclick="irParaPaginaNuvem(1)">«</button><button class="btn-pag-nav" onclick="mudarPaginaNuvem(-1)">‹</button>`;
    for (let i = Math.max(1, paginaAtualNuvem - 2); i <= Math.min(totalPaginas, Math.max(1, paginaAtualNuvem - 2) + 4); i++) html += `<button class="${i === paginaAtualNuvem ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPaginaNuvem(${i})">${i}</button>`;
    html += `<button class="btn-pag-nav" onclick="mudarPaginaNuvem(1)">›</button><button class="btn-pag-nav" onclick="irParaPaginaNuvem(${totalPaginas})">»</button>`;
    container.innerHTML = html;
}
function mudarPaginaNuvem(delta) { paginaAtualNuvem += delta; renderizarPaginaNuvem(); }
function irParaPaginaNuvem(pagina) { paginaAtualNuvem = pagina; renderizarPaginaNuvem(); }
function resetarPaginacaoNuvem() { paginaAtualNuvem = 1; renderizarPaginaNuvem(); }

// ==========================================
// FUNÇÕES DO RELATÓRIO E MATRIZ RFM
// ==========================================
let todaABaseDeClientes = [];
let paginaAtualRelatorio = 1;
const itensPorPaginaRelatorio = 50;
let colunaOrdenacao = -1;
let ordemCrescente = true;

function renderizarMatrizRFM() {
    if (todaABaseDeClientes.length === 0) return;

    let somaLTV = 0, somaFreq = 0, somaRecencia = 0, clientesComCompra = 0;
    let campeoes = 0, fieis = 0, recentes = 0, risco = 0;
    const hoje = new Date();

    todaABaseDeClientes.forEach(c => {
        let freq = parseInt(c.total_pedidos) || 0;
        if (freq === 0) return; 
        
        let ltv = parseFloat(c.valor_total) || 0;
        let recencia = 0;
        
        if (c.ultima_compra) {
            const dataCompra = new Date(c.ultima_compra);
            recencia = Math.ceil(Math.abs(hoje - dataCompra) / (1000 * 60 * 60 * 24));
        }

        somaLTV += ltv; somaFreq += freq; somaRecencia += recencia; clientesComCompra++;

        if (recencia <= 30 && freq >= 3 && ltv > 1000) campeoes++;
        else if (freq >= 2 && recencia <= 90) fieis++;
        else if (freq === 1 && recencia <= 30) recentes++;
        else risco++; 
    });

    if (clientesComCompra > 0) {
        document.getElementById('rfm-r-avg').innerText = Math.round(somaRecencia / clientesComCompra) + ' d';
        document.getElementById('rfm-f-avg').innerText = (somaFreq / clientesComCompra).toFixed(1);
        document.getElementById('rfm-m-avg').innerText = 'R$ ' + (somaLTV / clientesComCompra).toFixed(2).replace('.', ',');
        
        document.getElementById('rfm-campeoes').innerText = campeoes + ' clientes';
        document.getElementById('rfm-fieis').innerText = fieis + ' clientes';
        document.getElementById('rfm-recentes').innerText = recentes + ' clientes';
        document.getElementById('rfm-emrisco').innerText = risco + ' clientes';
    }
}

function renderizarGraficoClientes() {
    const divGrafico = document.getElementById('grafico-clientes-div');
    if (!divGrafico || typeof google === 'undefined' || !google.visualization) return;
    let contagem = { "DIAMANTE": 0, "OURO": 0, "PRATA": 0, "BRONZE": 0, "PRIMEIRA COMPRA": 0 };
    todaABaseDeClientes.forEach(c => {
        let totalPedidos = c.total_pedidos || 0; let valorTotal = parseFloat(c.valor_total || 0);
        if (totalPedidos === 1) contagem["PRIMEIRA COMPRA"]++;
        else if (totalPedidos > 1) { if (valorTotal <= 1000) contagem["BRONZE"]++; else if (valorTotal <= 3000) contagem["PRATA"]++; else if (valorTotal <= 6000) contagem["OURO"]++; else contagem["DIAMANTE"]++; }
    });
    const dadosGrafico = [['Grupo', 'Quantidade'],['Diamante', contagem["DIAMANTE"]],['Ouro', contagem["OURO"]],['Prata', contagem["PRATA"]],['Bronze', contagem["BRONZE"]],['1ª Compra', contagem["PRIMEIRA COMPRA"]]];
    const dataTable = google.visualization.arrayToDataTable(dadosGrafico);
    const options = { title: 'Distribuição de Clientes', pieHole: 0.4, colors: ['#d97706', '#a16207', '#475569', '#c2410c', '#4338ca'], backgroundColor: 'transparent', chartArea: { width: '90%', height: '75%' }, legend: { position: 'right', textStyle: { color: '#475569', fontSize: 13 } } };
    new google.visualization.PieChart(divGrafico).draw(dataTable, options);
}

// 6. MATRIZ RFM BASEADA EM SCORE E CLICKABLE
async function carregarClientesTinyDB() {
    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const data = await resposta.json();
        if (data.sucesso) { 
            const hoje = new Date();
            todaABaseDeClientes = data.clientes.map(c => {
                let r = 1, f = 1, m = 1;
                let recenciaDias = 999;
                
                // Extrai Recência Real
                if (c.ultima_compra) recenciaDias = Math.ceil(Math.abs(hoje - new Date(c.ultima_compra)) / (1000 * 60 * 60 * 24));
                
                // Pontuação R (1 a 5)
                if (recenciaDias <= 30) r = 5; else if (recenciaDias <= 90) r = 4; else if (recenciaDias <= 180) r = 3; else if (recenciaDias <= 365) r = 2; else r = 1;
                // Pontuação F (1 a 5)
                if (c.total_pedidos >= 5) f = 5; else if (c.total_pedidos >= 3) f = 4; else if (c.total_pedidos === 2) f = 3; else if (c.total_pedidos === 1) f = 1; else f = 0;
                // Pontuação M (1 a 5)
                if (c.valor_total >= 3000) m = 5; else if (c.valor_total >= 1000) m = 4; else if (c.valor_total >= 500) m = 3; else if (c.valor_total > 0) m = 2; else m = 0;

                // Classificação Inteligente Prax.ai
                let segmento = "SEM COMPRAS";
                if (f > 0) {
                    if (r >= 4 && f >= 4 && m >= 4) segmento = "CAMPEOES";
                    else if (r >= 2 && f >= 3) segmento = "FIEIS";
                    else if (r >= 4 && f <= 2) segmento = "RECENTES";
                    else segmento = "RISCO";
                }
                
                return { ...c, rfm_score: {r, f, m}, recenciaDias, segmento_rfm: segmento };
            });
            resetarEPaginacao(); 
        } 
    } catch (e) { console.error("Erro RFM:", e); }
}

// Interatividade: Redireciona o clique no Card RFM para a aba Clientes filtrada!
function filtrarTabelaPorRFM(segmento) {
    mostrarSubPaginaDash('tiny'); 
    const filtroDropdown = document.getElementById("filtro-grupo");
    if (filtroDropdown) filtroDropdown.value = segmento;
    resetarEPaginacao(); 
}

function classificarClienteVisual(totalPedidos, valorTotal) {
    if (totalPedidos === 0) return '<span class="badge badge-semcompra">SEM COMPRAS</span>';
    if (totalPedidos === 1) return '<span class="badge badge-primeiracompra">1ª COMPRA</span>';
    if (valorTotal > 6000) return '<span class="badge badge-diamante">DIAMANTE</span>';
    if (valorTotal > 3000) return '<span class="badge badge-ouro">OURO</span>';
    if (valorTotal > 1000) return '<span class="badge badge-prata">PRATA</span>';
    return '<span class="badge badge-bronze">BRONZE</span>';
}

function ordenarTabela(colIndex) {
    if (colunaOrdenacao === colIndex) {
        ordemCrescente = !ordemCrescente; 
    } else { 
        colunaOrdenacao = colIndex; 
        ordemCrescente = true; 
    }
    
    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        
        switch(colIndex) {
            case 0: valA = (a.nome || '').toLowerCase(); valB = (b.nome || '').toLowerCase(); break;
            case 1: valA = (a.telefone || '').replace(/\D/g, ''); valB = (b.telefone || '').replace(/\D/g, ''); break;
            case 2: valA = (a.cpf || '').replace(/\D/g, ''); valB = (b.cpf || '').replace(/\D/g, ''); break;
            case 3: valA = (a.cidade || '').toLowerCase(); valB = (b.cidade || '').toLowerCase(); break;
            case 4: valA = (a.estado || '').toLowerCase(); valB = (b.estado || '').toLowerCase(); break;
            case 5: valA = a.segmento_rfm || ''; valB = b.segmento_rfm || ''; break; 
            case 6: valA = parseInt(a.total_pedidos || 0); valB = parseInt(b.total_pedidos || 0); break;
            case 7: valA = parseFloat(a.ticket_medio || 0); valB = parseFloat(b.ticket_medio || 0); break;
            case 8: valA = parseInt(a.tempo_medio_entrega_dias || 0); valB = parseInt(b.tempo_medio_entrega_dias || 0); break;
            case 9: valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); break;
        }
        
        if (valA < valB) return ordemCrescente ? -1 : 1;
        if (valA > valB) return ordemCrescente ? 1 : -1;
        return 0;
    });

    // Atualiza as setinhas no cabeçalho
    for(let i = 0; i <= 9; i++) { 
        const icon = document.getElementById(`sort-icon-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-icon-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescente ? '↑' : '↓'; activeIcon.classList.add('active'); }
    
    resetarEPaginacao();
}

// ==========================================================
// ORDENAÇÃO: ABA PEDIDOS (NUVEMSHOP)
// ==========================================================
function ordenarTabelaNuvem(colIndex) {
    if (colunaOrdenacaoNuvem === colIndex) {
        ordemCrescenteNuvem = !ordemCrescenteNuvem; 
    } else { 
        colunaOrdenacaoNuvem = colIndex; 
        ordemCrescenteNuvem = true; 
    }
    
    todosOsPedidosNuvem.sort((a, b) => {
        let valA, valB;
        switch(colIndex) {
            case 0: valA = new Date(a.data_criacao).getTime(); valB = new Date(b.data_criacao).getTime(); break;
            case 1: valA = parseInt((a.numero_pedido || '0').replace(/\D/g, '')); valB = parseInt((b.numero_pedido || '0').replace(/\D/g, '')); break;
            case 2: valA = (a.nome_cliente || '').toLowerCase(); valB = (b.nome_cliente || '').toLowerCase(); break;
            case 3: valA = (a.status_nuvemshop || '').toLowerCase(); valB = (b.status_nuvemshop || '').toLowerCase(); break;
        }
        
        if (valA < valB) return ordemCrescenteNuvem ? -1 : 1;
        if (valA > valB) return ordemCrescenteNuvem ? 1 : -1;
        return 0;
    });

    // Atualiza as setinhas no cabeçalho
    for(let i = 0; i <= 3; i++) { 
        const icon = document.getElementById(`sort-nuvem-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-nuvem-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescenteNuvem ? '↑' : '↓'; activeIcon.classList.add('active'); }
    
    resetarPaginacaoNuvem();
}

function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    const filtroGrupo = document.getElementById("filtro-grupo")?.value || "TODOS";
    const termoBusca = (document.getElementById("filtro-texto")?.value || "").toLowerCase();
    
    let dadosFiltrados = todaABaseDeClientes.filter(c => {
        const nomeStr = (c.nome || "").toLowerCase(); const cpfStr = (c.cpf || "").toLowerCase();
        if (termoBusca !== "" && !nomeStr.includes(termoBusca) && !cpfStr.includes(termoBusca)) return false;
        if (filtroGrupo !== "TODOS") {
            let totalPedidos = c.total_pedidos || 0; let valorTotal = parseFloat(c.valor_total || 0); let grupoReal = "SEM COMPRAS";
            if (totalPedidos === 1) grupoReal = "PRIMEIRA COMPRA";
            else if (totalPedidos > 1) { if (valorTotal <= 1000) grupoReal = "BRONZE"; else if (valorTotal <= 3000) grupoReal = "PRATA"; else if (valorTotal <= 6000) grupoReal = "OURO"; else grupoReal = "DIAMANTE"; }
            if (grupoReal !== filtroGrupo) return false;
        }
        return true;
    });

    const contadorElem = document.getElementById('contador-cadastros');
    if (contadorElem) contadorElem.innerText = `${dadosFiltrados.length} cadastro(s)`;
    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPaginaRelatorio);
    if (paginaAtualRelatorio > totalPaginas && totalPaginas > 0) paginaAtualRelatorio = totalPaginas;
    const inicio = (paginaAtualRelatorio - 1) * itensPorPaginaRelatorio;
    const itensDaPagina = dadosFiltrados.slice(inicio, inicio + itensPorPaginaRelatorio);

    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">Nenhum cliente encontrado.</td></tr>';
    else {
        itensDaPagina.forEach(cliente => {
            const valTotalNum = parseFloat(cliente.valor_total || 0);
            const seloHtml = classificarClienteVisual(cliente.total_pedidos || 0, valTotalNum);
            const wppFormatado = formatarWhatsAppClicavel(cliente.telefone);
            const cpfFormatado = formatarDocumento(cliente.cpf);
            const ticketMedio = parseFloat(cliente.ticket_medio || 0).toFixed(2).replace('.', ',');
            const tempoEntrega = cliente.tempo_medio_entrega_dias > 0 ? `${cliente.tempo_medio_entrega_dias} dias` : '-';
            
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${cliente.nome}</td>
                <td style="white-space:nowrap">${wppFormatado}</td>
                <td style="white-space:nowrap">${cpfFormatado}</td>
                <td>${cliente.cidade || '-'}</td>
                <td>${cliente.estado || '-'}</td>
                <td>${seloHtml}</td>
                <td style="text-align:center;">${cliente.total_pedidos || 0}</td>
                <td style="white-space:nowrap">R$ ${ticketMedio}</td>
                <td style="text-align:center;">${tempoEntrega}</td>
                <td data-valor="${valTotalNum}" style="white-space:nowrap; font-weight:600;">R$ ${valTotalNum.toFixed(2).replace('.', ',')}</td>
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
    let html = `<button class="btn-pag-nav" onclick="irParaPagina(1)">«</button><button class="btn-pag-nav" onclick="mudarPagina(-1)">‹</button>`;
    for (let i = Math.max(1, paginaAtualRelatorio - 2); i <= Math.min(totalPaginas, Math.max(1, paginaAtualRelatorio - 2) + 4); i++) html += `<button class="${i === paginaAtualRelatorio ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPagina(${i})">${i}</button>`;
    html += `<button class="btn-pag-nav" onclick="mudarPagina(1)">›</button><button class="btn-pag-nav" onclick="irParaPagina(${totalPaginas})">»</button>`;
    container.innerHTML = html;
}
function mudarPagina(delta) { paginaAtualRelatorio += delta; renderizarPaginaRelatorio(); }
function irParaPagina(pagina) { paginaAtualRelatorio = pagina; renderizarPaginaRelatorio(); }
function resetarEPaginacao() { paginaAtualRelatorio = 1; renderizarPaginaRelatorio(); }

// ============================================================================
// MÓDULO 6: INTELIGÊNCIA LOGÍSTICA (Análise de CEPs e Mapa)
// ============================================================================

function mapEstadoParaISO(estado) {
    if (!estado) return null; const uf = estado.trim().toUpperCase();
    const map = { 'AC': 'BR-AC', 'ACRE': 'BR-AC', 'AL': 'BR-AL', 'ALAGOAS': 'BR-AL', 'AP': 'BR-AP', 'AMAPÁ': 'BR-AP', 'AMAPA': 'BR-AP', 'AM': 'BR-AM', 'AMAZONAS': 'BR-AM', 'BA': 'BR-BA', 'BAHIA': 'BR-BA', 'CE': 'BR-CE', 'CEARÁ': 'BR-CE', 'CEARA': 'BR-CE', 'DF': 'BR-DF', 'DISTRITO FEDERAL': 'BR-DF', 'BRASÍLIA': 'BR-DF', 'ES': 'BR-ES', 'ESPÍRITO SANTO': 'BR-ES', 'ESPIRITO SANTO': 'BR-ES', 'GO': 'BR-GO', 'GOIÁS': 'BR-GO', 'GOIAS': 'BR-GO', 'MA': 'BR-MA', 'MARANHÃO': 'BR-MA', 'MARANHAO': 'BR-MA', 'MT': 'BR-MT', 'MATO GROSSO': 'BR-MT', 'MS': 'BR-MS', 'MATO GROSSO DO SUL': 'BR-MS', 'MG': 'BR-MG', 'MINAS GERAIS': 'BR-MG', 'PA': 'BR-PA', 'PARÁ': 'BR-PA', 'PARA': 'BR-PA', 'PB': 'BR-PB', 'PARAÍBA': 'BR-PB', 'PARAIBA': 'BR-PB', 'PR': 'BR-PR', 'PARANÁ': 'BR-PR', 'PARANA': 'BR-PR', 'PE': 'BR-PE', 'PERNAMBUCO': 'BR-PE', 'PI': 'BR-PI', 'PIAUÍ': 'BR-PI', 'PIAUI': 'BR-PI', 'RJ': 'BR-RJ', 'RIO DE JANEIRO': 'BR-RJ', 'RN': 'BR-RN', 'RIO GRANDE DO NORTE': 'BR-RN', 'RS': 'BR-RS', 'RIO GRANDE DO SUL': 'BR-RS', 'RO': 'BR-RO', 'RONDÔNIA': 'BR-RO', 'RONDONIA': 'BR-RO', 'RR': 'BR-RR', 'RORAIMA': 'BR-RR', 'SC': 'BR-SC', 'SANTA CATARINA': 'BR-SC', 'SP': 'BR-SP', 'SÃO PAULO': 'BR-SP', 'SAO PAULO': 'BR-SP', 'SE': 'BR-SE', 'SERGIPE': 'BR-SE', 'TO': 'BR-TO', 'TOCANTINS': 'BR-TO' };
    return map[uf] || null;
}

function normalizarNomeEstado(estadoRaw) {
    if (!estadoRaw || estadoRaw.trim() === '') return 'Internacional/Outros'; const input = estadoRaw.trim().toUpperCase();
    const mapNormalizacao = { 'ACRE': 'Acre', 'AC': 'Acre', 'ALAGOAS': 'Alagoas', 'AL': 'Alagoas', 'AMAPÁ': 'Amapá', 'AMAPA': 'Amapá', 'AP': 'Amapá', 'AMAZONAS': 'Amazonas', 'AM': 'Amazonas', 'BAHIA': 'Bahia', 'BA': 'Bahia', 'CEARÁ': 'Ceará', 'CEARA': 'Ceará', 'CE': 'Ceará', 'DISTRITO FEDERAL': 'Distrito Federal', 'BRASÍLIA': 'Distrito Federal', 'BRASILIA': 'Distrito Federal', 'DF': 'Distrito Federal', 'ESPÍRITO SANTO': 'Espírito Santo', 'ESPIRITO SANTO': 'Espírito Santo', 'ES': 'Espírito Santo', 'GOIÁS': 'Goiás', 'GOIAS': 'Goiás', 'GO': 'Goiás', 'MARANHÃO': 'Maranhão', 'MARANHAO': 'Maranhão', 'MA': 'Maranhão', 'MATO GROSSO': 'Mato Grosso', 'MT': 'Mato Grosso', 'MATO GROSSO DO SUL': 'Mato Grosso do Sul', 'MS': 'Mato Grosso do Sul', 'MINAS GERAIS': 'Minas Gerais', 'MG': 'Minas Gerais', 'PARÁ': 'Pará', 'PARA': 'Pará', 'PA': 'Pará', 'PARAÍBA': 'Paraíba', 'PARAIBA': 'Paraíba', 'PB': 'Paraíba', 'PARANÁ': 'Paraná', 'PARANA': 'Paraná', 'PR': 'Paraná', 'PERNAMBUCO': 'Pernambuco', 'PE': 'Pernambuco', 'PIAUÍ': 'Piauí', 'PIAUI': 'Piauí', 'PI': 'Piauí', 'RIO DE JANEIRO': 'Rio de Janeiro', 'RJ': 'Rio de Janeiro', 'RIO GRANDE DO NORTE': 'Rio Grande do Norte', 'RN': 'Rio Grande do Norte', 'RIO GRANDE DO SUL': 'Rio Grande do Sul', 'RS': 'Rio Grande do Sul', 'RONDÔNIA': 'Rondônia', 'RONDONIA': 'Rondônia', 'RO': 'Rondônia', 'RORAIMA': 'Roraima', 'RR': 'Roraima', 'SANTA CATARINA': 'Santa Catarina', 'SC': 'Santa Catarina', 'SÃO PAULO': 'São Paulo', 'SAO PAULO': 'São Paulo', 'SP': 'São Paulo', 'SERGIPE': 'Sergipe', 'SE': 'Sergipe', 'TO': 'TOCANTINS', 'TOCANTINS': 'Tocantins' };
    return mapNormalizacao[input] || estadoRaw; 
}

// ==========================================================
// ORDENAÇÃO E RENDERIZAÇÃO: ABA REGIÕES LOGÍSTICAS (CEP)
// ==========================================================
let colunaOrdenacaoCep = -1;
let ordemCrescenteCep = true;

function ordenarTabelaCep(colIndex) {
    if (colunaOrdenacaoCep === colIndex) {
        ordemCrescenteCep = !ordemCrescenteCep; 
    } else { 
        colunaOrdenacaoCep = colIndex; 
        ordemCrescenteCep = true; 
    }
    
    // Atualiza os ícones visuais (setinhas)
    for(let i = 0; i <= 3; i++) { 
        const icon = document.getElementById(`sort-cep-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-cep-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescenteCep ? '↑' : '↓'; activeIcon.classList.add('active'); }
    
    // Re-desenha a tabela com a nova ordem aplicada
    renderizarTabelaCEPs();
}

function renderizarTabelaCEPs() {
    const tbody = document.getElementById('corpo-tabela-ceps'); 
    const divMapaCard = document.getElementById('mapa_brasil_card'); 
    const divMapaCanvas = document.getElementById('mapa_brasil_div');
    if (!tbody || !divMapaCanvas) return;
    
    const filtroCepLimpo = (document.getElementById("busca-cep-analise")?.value || "").replace(/\D/g, '');
    let analiseAgrupadaTabela = {}; 
    let analiseAgrupadaMapaBR = {};
    
    // O mesmo agrupamento inteligente continua igual
    todosOsPedidosNuvem.forEach(p => {
        if (!p.data_envio || !p.data_entrega) return;
        const status = (p.status_nuvemshop || '').toUpperCase();
        if (status !== 'ENTREGUE' && status !== 'ARQUIVADO') return;
        const cepLimpo = (p.cep || '').replace(/\D/g, '');
        const ufStandard = normalizarNomeEstado(p.estado || 'Não Informado');
        if (filtroCepLimpo && !cepLimpo.includes(filtroCepLimpo)) return;
        const diffDias = Math.ceil(Math.abs(new Date(p.data_entrega) - new Date(p.data_envio)) / (1000 * 60 * 60 * 24));
        
        let chaveGrupoTabela = filtroCepLimpo === "" ? ufStandard : `${ufStandard}|${cepLimpo.length >= 5 ? cepLimpo.substring(0, 5) + '-***' : (cepLimpo || 'Sem CEP')}`;
        let textoCepExibicao = filtroCepLimpo === "" ? 'Geral (Todo o Estado)' : (cepLimpo.length >= 5 ? cepLimpo.substring(0, 5) + '-***' : (cepLimpo || 'Sem CEP'));
        
        if (!analiseAgrupadaTabela[chaveGrupoTabela]) analiseAgrupadaTabela[chaveGrupoTabela] = { estado: ufStandard, cep: textoCepExibicao, somaDias: 0, quantidadePedidos: 0 };
        analiseAgrupadaTabela[chaveGrupoTabela].somaDias += diffDias; 
        analiseAgrupadaTabela[chaveGrupoTabela].quantidadePedidos += 1;
        
        const isoCode = mapEstadoParaISO(ufStandard);
        if (isoCode) { 
            if (!analiseAgrupadaMapaBR[isoCode]) analiseAgrupadaMapaBR[isoCode] = { somaDias: 0, quantidadePedidos: 0 };
            analiseAgrupadaMapaBR[isoCode].somaDias += diffDias; 
            analiseAgrupadaMapaBR[isoCode].quantidadePedidos += 1;
        }
    });

    if (filtroCepLimpo === "" && Object.keys(analiseAgrupadaMapaBR).length > 0) {
        if (divMapaCanvas && divMapaCard && isGoogleChartsReady && typeof google !== 'undefined' && google.visualization) {
            try {
                let dadosMapa = [ ["Region", "Média de Dias", "Quantidade"] ];
                Object.entries(analiseAgrupadaMapaBR).forEach(([iso, dados]) => dadosMapa.push([ iso, Math.round(dados.somaDias / dados.quantidadePedidos), dados.quantidadePedidos ]));
                const options = { region: 'BR', resolution: 'provinces', displayMode: 'regions', colorAxis: { colors: ['#a7f3d0', '#fef08a', '#fca5a5'] }, backgroundColor: 'transparent', datalessRegionColor: '#f1f5f9', legend: { textStyle: { color: '#475569', fontSize: 11 } } };
                new google.visualization.GeoChart(divMapaCanvas).draw(google.visualization.arrayToDataTable(dadosMapa), options);
                divMapaCard.style.display = 'block';
            } catch(mapErro) { divMapaCard.style.display = 'none'; }
        }
    } else if (divMapaCard) {
        divMapaCard.style.display = 'none';
    }

    // Transforma o agrupamento numa lista para a tabela
    let resultadosTabela = Object.values(analiseAgrupadaTabela).map(item => ({ 
        estado: item.estado, 
        cep: item.cep, 
        mediaDias: Math.round(item.somaDias / item.quantidadePedidos), 
        quantidade: item.quantidadePedidos 
    }));
    
    // APLICA A ORDENAÇÃO CONFORME CLIQUE (OU ORDEM ALFABÉTICA POR DEFEITO)
    if (colunaOrdenacaoCep !== -1) {
        resultadosTabela.sort((a, b) => {
            let valA, valB;
            switch(colunaOrdenacaoCep) {
                case 0: valA = a.estado; valB = b.estado; break;
                case 1: valA = a.cep; valB = b.cep; break;
                case 2: valA = a.mediaDias; valB = b.mediaDias; break;
                case 3: valA = a.quantidade; valB = b.quantidade; break;
            }
            if (valA < valB) return ordemCrescenteCep ? -1 : 1;
            if (valA > valB) return ordemCrescenteCep ? 1 : -1;
            return 0;
        });
    } else {
        // Ordem padrão: Alfabética por Estado
        resultadosTabela.sort((a, b) => a.estado.localeCompare(b.estado));
    }
    
    // Limpa e desenha o HTML da tabela
    tbody.innerHTML = '';
    if (resultadosTabela.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum histórico encontrado.</td></tr>`; 
        return;
    }
    
    resultadosTabela.forEach(r => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td style="font-weight:500;">${r.estado}</td> 
            <td style="font-family: monospace; font-size: 14px; color: #64748b;">${r.cep}</td>
            <td style="font-weight: bold; color: #2563eb; font-size: 15px;">${r.mediaDias} dias</td>
            <td style="color: #475569;">${r.quantidade} entregas mapeadas</td>
        `;
        tbody.appendChild(linha);
    });
}