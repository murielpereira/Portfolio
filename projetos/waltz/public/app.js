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
    <div style="background-color: #0f172a; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
        <div style="background: white; border-radius: 12px; padding: 40px; width: 100%; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="/components/images/logo.png" alt="Waltz" style="height: 45px; margin-bottom: 15px; border-radius: 4px;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">Acesse sua conta para continuar</p>
            </div>
            <form id="form-login">
                <div style="margin-bottom: 20px;">
                    <label for="usuario" style="display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b; font-size: 13px;">E-mail</label>
                    <input type="text" id="usuario" name="usuario" placeholder="seu@email.com" style="width: 100%; padding: 12px 15px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; font-size: 14px; box-sizing: border-box; color: #334155;" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="senha" style="display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b; font-size: 13px;">Senha</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="senha" name="senha" placeholder="••••••••" style="width: 100%; padding: 12px 15px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; font-size: 14px; box-sizing: border-box; color: #334155;" required>
                        <button type="button" id="btn-mostrar-senha" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex;"><span class="material-symbols-outlined" id="icone-senha" style="font-size: 20px;">visibility</span></button>
                    </div>
                </div>
                <div style="text-align: right; margin-bottom: 30px;"><a href="#" style="color: #64748b; font-size: 13px; text-decoration: none;">Esqueceu a senha?</a></div>
                <button type="submit" id="btn-login-submit" style="width: 100%; background-color: #1e293b; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; transition: background 0.3s;">Entrar</button>
            </form>
        </div>
    </div>`;
}

function getTemplatePainel() {
    return `
    <div class="dashboard-wrapper">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <img src="/components/images/logo.png" alt="Waltz" style="border-radius:4px; max-height: 40px; filter: brightness(0) invert(1);"> 
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
                
                <!-- ABA DASHBOARD -->
                <div id="sub-dash" class="sub-pagina" style="display: none;">
                    <div class="kpi-grid">
                        <div class="kpi-card"><div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;"><i data-lucide="users"></i></div><div class="kpi-info"><h3>Clientes</h3><div class="value">27.935</div><div class="trend positive"><i data-lucide="trending-up" style="width:12px;"></i> +12%</div></div></div>
                        <div class="kpi-card"><div class="kpi-icon" style="background:#ecfdf5; color:#10b981;"><i data-lucide="shopping-cart"></i></div><div class="kpi-info"><h3>Pedidos</h3><div class="value">7.485</div><div class="trend positive"><i data-lucide="trending-up" style="width:12px;"></i> +8%</div></div></div>
                        <div class="kpi-card"><div class="kpi-icon" style="background:#fffbeb; color:#f59e0b;"><i data-lucide="truck"></i></div><div class="kpi-info"><h3>Entregas Pendentes</h3><div class="value">342</div><div class="trend negative"><i data-lucide="trending-down" style="width:12px;"></i> -5%</div></div></div>
                        <div class="kpi-card"><div class="kpi-icon" style="background:#fef2f2; color:#ef4444;"><i data-lucide="mail"></i></div><div class="kpi-info"><h3>E-mails Enviados</h3><div class="value">1.204</div><div class="trend positive"><i data-lucide="trending-up" style="width:12px;"></i> +23%</div></div></div>
                    </div>
                    <div class="charts-grid">
                        <div class="chart-card" id="grafico-clientes-div" style="padding: 20px; align-items: center;">Carregando gráfico...</div>
                        <div class="chart-card">Desempenho logístico — em breve</div>
                    </div>
                </div>

                <!-- ABA TINY (CLIENTES) -->
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
                                <tbody id="tabela-clientes-body">
                                    <tr><td colspan="10" style="text-align:center; padding: 30px;">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="paginacao-controles" id="paginacao-ltv"></div>
                    </div>
                </div>

                <!-- ABA NUVEMSHOP (PEDIDOS) -->
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
                                        <th>Automações <span class="sort-icon">↑↓</span></th>
                                    </tr>
                                </thead>
                                <tbody id="corpo-tabela-nuvem">
                                    <tr><td colspan="5" style="text-align: center; padding: 30px;">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="paginacao-controles" id="paginacao-nuvem"></div>
                    </div>
                </div>
                
                <!-- ABA CEP -->
                <div id="sub-cep" class="sub-pagina" style="display: none;">
                    <section id="mapa_brasil_card" class="card" style="display:none; padding: 20px; margin-bottom: 20px; background:white; border-radius:12px; border:1px solid var(--border-color);">
                        <h2 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Visualização Geográfica (Heatmap de Entrega)</h2>
                        <div style="display: flex; justify-content: center; align-items: center; background: #f8fafc; border-radius: 8px; padding: 10px;">
                            <div id="mapa_brasil_div" style="width: 100%; max-width: 650px; height: 350px;"></div>
                        </div>
                    </section>
                    <div class="card-table">
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                                <thead>
                                    <tr><th>Estado (UF)</th><th>CEP Base</th><th>Média de Tempo de Entrega</th><th>Volume (Qtd de Pedidos)</th></tr>
                                </thead>
                                <tbody id="corpo-tabela-ceps"><tr><td colspan="4" style="text-align: center; padding: 30px;">Aguardando processamento...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ABA MATRIZ RFM -->
                <div id="sub-rfm" class="sub-pagina" style="display: none;">
                    <div class="card-table" style="padding: 30px; text-align: center;">
                        <div style="width: 60px; height: 60px; background: #eff6ff; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i data-lucide="target" style="width: 30px; height: 30px;"></i>
                        </div>
                        <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 10px;">Matriz RFM Inteligente</h2>
                        <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 30px;">
                            A análise de <b>Recência</b> (tempo desde a última compra), <b>Frequência</b> (quantidade de compras) e <b>Monetário</b> (valor gasto) está a ser construída. Em breve, você verá os seus clientes divididos entre "Campeões", "Fiéis" e "Em Risco" aqui!
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; max-width: 800px; margin: 0 auto;">
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed var(--border-color);"><b>R</b>ecência <br><span style="font-size:12px; color:var(--text-muted)">Dias desde a última compra</span></div>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed var(--border-color);"><b>F</b>requência <br><span style="font-size:12px; color:var(--text-muted)">Total de pedidos</span></div>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed var(--border-color);"><b>M</b>onetário <br><span style="font-size:12px; color:var(--text-muted)">Lifetime Value (LTV)</span></div>
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
    } catch (erro) {
        appDiv.innerHTML = '<p style="text-align:center; padding:50px; font-family:sans-serif;">Erro de conexão. Atualize a página.</p>';
    }
}

async function realizarLogin(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuario')?.value;
    const senha = document.getElementById('senha')?.value;
    const btn = document.getElementById('btn-login-submit');
    if (btn) { btn.innerText = 'Acessando...'; btn.disabled = true; }
    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const dados = await resposta.json();
        if (dados.sucesso) window.location.reload(); 
        else alert('Usuário ou senha incorretos!');
    } catch (erro) { alert('Erro ao conectar com o servidor.'); } 
    finally { if (btn) { btn.innerText = 'Entrar'; btn.disabled = false; } }
}

async function realizarLogout() {
    try { await fetch('/api/logout'); window.location.reload(); } catch (erro) { console.error("Erro ao sair:", erro); }
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
            <div class="search-bar"><i data-lucide="search"></i><input type="text" id="filtro-texto" placeholder="Buscar por nome ou CPF..." onkeyup="resetarEPaginacao()"></div>
            <select id="filtro-grupo" class="select-modern" onchange="resetarEPaginacao()">
                <option value="TODOS">Todos os Grupos</option><option value="DIAMANTE">Diamante</option><option value="OURO">Ouro</option><option value="PRATA">Prata</option><option value="BRONZE">Bronze</option><option value="PRIMEIRA COMPRA">1ª Compra</option><option value="SEM COMPRAS">Sem Compras</option>
            </select>
            <span id="contador-cadastros" class="contador-badge">0 cadastro(s)</span>
        `;
        await carregarClientesTinyDB();
    } else if (idAlvo === 'nuvem') {
        document.getElementById('dash-page-title').innerText = "Pedidos";
        document.getElementById('dash-page-subtitle').innerText = "Listagem de vendas";
        topActions.innerHTML = `
            <div class="search-bar"><i data-lucide="search"></i><input type="text" id="busca-nuvem" placeholder="Buscar pedido ou cliente..." onkeyup="resetarPaginacaoNuvem()"></div>
            <select id="filtro-status-nuvem" class="select-modern" onchange="resetarPaginacaoNuvem()">
                <option value="TODOS">Todos os Status</option><option value="Aberto">Aberto</option><option value="Entregue">Entregue</option><option value="Arquivado">Arquivado</option><option value="Cancelado">Cancelado</option>
            </select>
            <span id="contador-nuvem" class="contador-badge">0 pedido(s)</span>
        `;
        await carregarPedidosNuvemDB();
    } else if (idAlvo === 'rfm') {
        document.getElementById('dash-page-title').innerText = "Matriz RFM";
        document.getElementById('dash-page-subtitle').innerText = "Inteligência de Segmentação";
    } else if (idAlvo === 'cep') { 
        document.getElementById('dash-page-title').innerText = "Desempenho Logístico por Região";
        document.getElementById('dash-page-subtitle').innerText = "Análise de tempo de entrega";
        topActions.innerHTML = `<div class="search-bar"><i data-lucide="search"></i><input type="text" id="busca-cep-analise" placeholder="Filtrar por CEP (Ex: 01000)..." onkeyup="renderizarTabelaCEPs()"></div>`;
        if (todosOsPedidosNuvem.length === 0) await carregarPedidosNuvemDB(); 
        renderizarTabelaCEPs();
    }
    atualizarIcones();
}

let todosOsPedidosNuvem = [];
let paginaAtualNuvem = 1;
const itensPorPaginaNuvem = 50;

async function carregarPedidosNuvemDB() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Carregando pedidos do Banco de Dados...</td></tr>';
    try {
        const resposta = await fetch('/api/pedidos');
        if (!resposta.ok) throw new Error("Falha ao carregar banco de dados.");
        todosOsPedidosNuvem = await resposta.json();
        resetarPaginacaoNuvem();
    } catch (e) { 
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;"><b>Erro:</b> ${e.message}</td></tr>`;
    }
}

async function enviarFeedbackWpp(idPedido, telefone, nome, numPedido, produtosCodificados) {
    if (!telefone || telefone === 'undefined' || telefone.trim() === '') { alert("⚠️ Este pedido não possui telefone."); return; }
    const numeroApenasDigitos = telefone.replace(/\D/g, '');
    const primeiroNome = nome.split(' ')[0]; 
    const produtos = decodeURIComponent(produtosCodificados); 
    let trechoProdutos = '';
    if (produtos && produtos.trim() !== '' && produtos !== 'undefined') trechoProdutos = `\n\n📦 *Itens do pedido:* ${produtos}`;
    const mensagem = `Oii ${primeiroNome}, tudo bem? Aqui é a Gabi...\n\nEstou entrando em contato pra saber se deu tudo certo com o seu pedido #${numPedido}.${trechoProdutos}`;
    const linkZap = `https://wa.me/55${numeroApenasDigitos}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkZap, '_blank');

    try {
        await fetch('/api/pedidos/marcar-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_pedido: idPedido }) });
        const pedidoIndex = todosOsPedidosNuvem.findIndex(p => p.id_pedido === idPedido);
        if (pedidoIndex !== -1) {
            todosOsPedidosNuvem[pedidoIndex].status_feedback = 'Enviado';
            renderizarPaginaNuvem(); 
        }
    } catch (erro) { console.error(erro); }
}

function renderizarPaginaNuvem() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    
    const termoBusca = (document.getElementById("busca-nuvem")?.value || "").toLowerCase();
    const filtroStatus = document.getElementById("filtro-status-nuvem")?.value || "TODOS";
    
    let dadosFiltrados = todosOsPedidosNuvem.filter(p => {
        const numPedido = (p.numero_pedido || "").toLowerCase();
        const nomeCliente = (p.nome_cliente || "").toLowerCase();
        const cpfCliente = (p.cpf_cliente || "").replace(/\D/g, ''); 
        const buscaLimpa = termoBusca.replace(/\D/g, ''); 
        const passaBusca = termoBusca === "" || numPedido.includes(termoBusca) || nomeCliente.includes(termoBusca) || (buscaLimpa !== "" && cpfCliente.includes(buscaLimpa));
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
            let checkAprovado = true; 
            let checkFab = stNuvem !== 'ABERTO' && stNuvem !== 'CANCELADO';
            let checkRastreio = p.rastreio && p.rastreio.trim() !== '' ? true : false;
            let checkRota = stNuvem === 'ENTREGUE' || stNuvem === 'ARQUIVADO';
            let checkFeedback = p.status_feedback === 'Enviado';

            const getIcon = (isDone, title) => isDone 
                ? `<svg title="${title}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` 
                : `<svg title="${title}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;

            let acaoComunicacao = `
                <div style="display:flex; gap:6px; align-items:center;">
                    ${getIcon(checkAprovado, "1. Pedido Aprovado")}
                    ${getIcon(checkFab, "2. Pedido em Fabricação")}
                    ${getIcon(checkRastreio, "3. Código de Rastreio")}
                    ${getIcon(checkRota, "4. Em Rota / Entregue")}
                    ${getIcon(checkFeedback, "5. Feedback WhatsApp")}
                </div>
            `;
            
            let statusNuvem = `<span class="badge badge-aberto">${stNuvem}</span>`;
            
            const linha = document.createElement('tr');
            linha.onclick = () => abrirDetalhesPedido(p.id_pedido);
            linha.innerHTML = `
                <td style="white-space:nowrap; color: var(--text-muted);">${dataF.split(' ')[0]} <br><span style="font-size:11px">${dataF.split(' ')[1]}</span></td>
                <td style="font-weight:600; color:var(--primary);">#${p.numero_pedido}</td>
                <td style="font-weight:500;">${p.nome_cliente || '-'}</td>
                <td>${statusNuvem}</td>
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

    let tempoTexto = 'Em andamento';
    if (pedido.data_envio && pedido.data_entrega) {
        const diffDias = Math.ceil(Math.abs(new Date(pedido.data_entrega) - new Date(pedido.data_envio)) / (1000 * 60 * 60 * 24));
        tempoTexto = `${diffDias} dias`;
    }

    let btnWpp = '';
    if (pedido.status_nuvemshop === 'Entregue' || pedido.status_nuvemshop === 'Arquivado') {
        const produtosSeguros = encodeURIComponent(pedido.produtos || '');
        btnWpp = `<button onclick="enviarFeedbackWpp('${pedido.id_pedido}', '${pedido.telefone}', '${pedido.nome_cliente}', '${pedido.numero_pedido}', '${produtosSeguros}')" style="margin-top: 20px; width: 100%; background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"><i data-lucide="message-circle"></i> Enviar Feedback WhatsApp</button>`;
    }

    const conteudo = document.getElementById('drawer-conteudo');
    conteudo.innerHTML = `
        <div class="detail-header-card">
            <div class="detail-avatar"><i data-lucide="user"></i></div>
            <div class="detail-header-info">
                <h3>${pedido.nome_cliente || '-'}</h3>
                <p><i data-lucide="phone" style="width:12px; height:12px;"></i> ${pedido.telefone || 'Sem telefone'}</p>
                <p><i data-lucide="mail" style="width:12px; height:12px;"></i> ${pedido.email_cliente || 'Sem e-mail'}</p>
            </div>
        </div>
        <div class="detail-group"><label>Documento (CPF/CNPJ)</label><p>${formatarDocumento(pedido.cpf_cliente || '-')}</p></div>
        <div class="detail-grid">
            <div class="detail-group"><label>Cidade</label><p>${pedido.cidade || '-'}</p></div>
            <div class="detail-group"><label>Estado (UF)</label><p>${pedido.estado || '-'}</p></div>
        </div>
        <div class="detail-group"><label>Transportadora</label><p>${pedido.transportadora || '-'}</p></div>
        <div class="detail-group"><label>Código de Rastreio</label><p style="font-family: monospace; color: var(--primary); font-weight: 600; font-size: 15px;">${pedido.rastreio || 'Aguardando envio...'}</p></div>
        <div class="detail-group"><label>Tempo de Entrega Logístico</label><p>${tempoTexto}</p></div>
        ${btnWpp}
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
    let html = `<button class="btn-pag-nav" onclick="irParaPaginaNuvem(1)" ${paginaAtualNuvem === 1 ? 'disabled' : ''}>«</button><button class="btn-pag-nav" onclick="mudarPaginaNuvem(-1)" ${paginaAtualNuvem === 1 ? 'disabled' : ''}>‹</button>`;
    let startPage = Math.max(1, paginaAtualNuvem - 2); let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4); 
    for (let i = startPage; i <= endPage; i++) html += `<button class="${i === paginaAtualNuvem ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPaginaNuvem(${i})">${i}</button>`;
    html += `<button class="btn-pag-nav" onclick="mudarPaginaNuvem(1)" ${paginaAtualNuvem === totalPaginas ? 'disabled' : ''}>›</button><button class="btn-pag-nav" onclick="irParaPaginaNuvem(${totalPaginas})" ${paginaAtualNuvem === totalPaginas ? 'disabled' : ''}>»</button>`;
    container.innerHTML = html;
}

function mudarPaginaNuvem(delta) { paginaAtualNuvem += delta; renderizarPaginaNuvem(); }
function irParaPaginaNuvem(pagina) { paginaAtualNuvem = pagina; renderizarPaginaNuvem(); }
function resetarPaginacaoNuvem() { paginaAtualNuvem = 1; renderizarPaginaNuvem(); }

let todaABaseDeClientes = [];
let paginaAtualRelatorio = 1;
const itensPorPaginaRelatorio = 50;
let colunaOrdenacao = -1;
let ordemCrescente = true;

function renderizarGraficoClientes() {
    const divGrafico = document.getElementById('grafico-clientes-div');
    if (!divGrafico || typeof google === 'undefined' || !google.visualization || !google.visualization.PieChart) return;
    let contagem = { "DIAMANTE": 0, "OURO": 0, "PRATA": 0, "BRONZE": 0, "PRIMEIRA COMPRA": 0 };
    todaABaseDeClientes.forEach(c => {
        let totalPedidos = c.total_pedidos || 0;
        let valorTotal = parseFloat(c.valor_total || 0);
        if (totalPedidos === 1) contagem["PRIMEIRA COMPRA"]++;
        else if (totalPedidos > 1) {
            if (valorTotal <= 1000) contagem["BRONZE"]++;
            else if (valorTotal <= 3000) contagem["PRATA"]++;
            else if (valorTotal <= 6000) contagem["OURO"]++;
            else contagem["DIAMANTE"]++;
        }
    });
    const dadosGrafico = [['Grupo', 'Quantidade'],['Diamante', contagem["DIAMANTE"]],['Ouro', contagem["OURO"]],['Prata', contagem["PRATA"]],['Bronze', contagem["BRONZE"]],['1ª Compra', contagem["PRIMEIRA COMPRA"]]];
    const dataTable = google.visualization.arrayToDataTable(dadosGrafico);
    const options = { title: 'Distribuição de Clientes', pieHole: 0.4, colors: ['#d97706', '#a16207', '#475569', '#c2410c', '#4338ca'], backgroundColor: 'transparent', chartArea: { width: '90%', height: '75%' }, legend: { position: 'right', textStyle: { color: '#475569', fontSize: 13 } } };
    const chart = new google.visualization.PieChart(divGrafico);
    chart.draw(dataTable, options);
}

async function carregarClientesTinyDB() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 30px;">Carregando clientes do Banco de Dados...</td></tr>';
    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const data = await resposta.json();
        if (data.sucesso) { todaABaseDeClientes = data.clientes; resetarEPaginacao(); } 
        else throw new Error("Falha");
    } catch (e) { tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">Erro ao carregar clientes.</td></tr>`; }
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
    if (colunaOrdenacao === colIndex) ordemCrescente = !ordemCrescente; else { colunaOrdenacao = colIndex; ordemCrescente = true; }
    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        switch(colIndex) {
            case 0: valA = (a.nome || '').toLowerCase(); valB = (b.nome || '').toLowerCase(); break;
            case 1: valA = (a.telefone || '').replace(/\D/g, ''); valB = (b.telefone || '').replace(/\D/g, ''); break;
            case 2: valA = (a.cpf || '').replace(/\D/g, ''); valB = (b.cpf || '').replace(/\D/g, ''); break;
            case 3: valA = (a.cidade || '').toLowerCase(); valB = (b.cidade || '').toLowerCase(); break;
            case 4: valA = (a.estado || '').toLowerCase(); valB = (b.estado || '').toLowerCase(); break;
            case 5: valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); break; 
            case 6: valA = parseInt(a.total_pedidos || 0); valB = parseInt(b.total_pedidos || 0); break;
            case 7: valA = parseFloat(a.ticket_medio || 0); valB = parseFloat(b.ticket_medio || 0); break;
            case 8: valA = parseInt(a.tempo_medio_entrega_dias || 0); valB = parseInt(b.tempo_medio_entrega_dias || 0); break;
            case 9: valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); break;
        }
        if (valA < valB) return ordemCrescente ? -1 : 1;
        if (valA > valB) return ordemCrescente ? 1 : -1;
        return 0;
    });
    for(let i = 0; i <= 9; i++) {
        const icon = document.getElementById(`sort-icon-${i}`);
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); }
    }
    const activeIcon = document.getElementById(`sort-icon-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescente ? '↑' : '↓'; activeIcon.classList.add('active'); }
    resetarEPaginacao();
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
            else if (totalPedidos > 1) {
                if (valorTotal <= 1000) grupoReal = "BRONZE"; else if (valorTotal <= 3000) grupoReal = "PRATA"; else if (valorTotal <= 6000) grupoReal = "OURO"; else grupoReal = "DIAMANTE";
            }
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
    let html = `<button class="btn-pag-nav" onclick="irParaPagina(1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''}>«</button><button class="btn-pag-nav" onclick="mudarPagina(-1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''}>‹</button>`;
    let startPage = Math.max(1, paginaAtualRelatorio - 2); let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4); 
    for (let i = startPage; i <= endPage; i++) html += `<button class="${i === paginaAtualRelatorio ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPagina(${i})">${i}</button>`;
    html += `<button class="btn-pag-nav" onclick="mudarPagina(1)" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''}>›</button><button class="btn-pag-nav" onclick="irParaPagina(${totalPaginas})" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''}>»</button>`;
    container.innerHTML = html;
}
function mudarPagina(delta) { paginaAtualRelatorio += delta; renderizarPaginaRelatorio(); }
function irParaPagina(pagina) { paginaAtualRelatorio = pagina; renderizarPaginaRelatorio(); }
function resetarEPaginacao() { paginaAtualRelatorio = 1; renderizarPaginaRelatorio(); }

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
function renderizarTabelaCEPs() {
    const tbody = document.getElementById('corpo-tabela-ceps'); const divMapaCard = document.getElementById('mapa_brasil_card'); const divMapaCanvas = document.getElementById('mapa_brasil_div');
    if (!tbody || !divMapaCanvas) return;
    const filtroCepLimpo = (document.getElementById("busca-cep-analise")?.value || "").replace(/\D/g, '');
    let analiseAgrupadaTabela = {}; let analiseAgrupadaMapaBR = {};
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
        analiseAgrupadaTabela[chaveGrupoTabela].somaDias += diffDias; analiseAgrupadaTabela[chaveGrupoTabela].quantidadePedidos += 1;
        
        const isoCode = mapEstadoParaISO(ufStandard);
        if (isoCode) { 
            if (!analiseAgrupadaMapaBR[isoCode]) analiseAgrupadaMapaBR[isoCode] = { somaDias: 0, quantidadePedidos: 0 };
            analiseAgrupadaMapaBR[isoCode].somaDias += diffDias; analiseAgrupadaMapaBR[isoCode].quantidadePedidos += 1;
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
    } else if (divMapaCard) divMapaCard.style.display = 'none';

    let resultadosTabela = Object.values(analiseAgrupadaTabela).map(item => ({ estado: item.estado, cep: item.cep, mediaDias: Math.round(item.somaDias / item.quantidadePedidos), quantidade: item.quantidadePedidos }));
    resultadosTabela.sort((a, b) => a.estado.localeCompare(b.estado));
    tbody.innerHTML = '';
    if (resultadosTabela.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum histórico encontrado.</td></tr>`; return;
    }
    resultadosTabela.forEach(r => {
        const linha = document.createElement('tr');
        linha.innerHTML = `<td style="font-weight:500;">${r.estado}</td> <td style="font-family: monospace; font-size: 14px; color: #64748b;">${r.cep}</td><td style="font-weight: bold; color: #2563eb; font-size: 15px;">${r.mediaDias} dias</td><td style="color: #475569;">${r.quantidade} entregas mapeadas</td>`;
        tbody.appendChild(linha);
    });
}