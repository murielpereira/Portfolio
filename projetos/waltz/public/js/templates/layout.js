export function getSidebar() {
    return `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <img src="./logo.png" alt="Waltz" style="border-radius:4px; max-height: 40px; cursor: pointer;" onclick="mostrarSubPaginaDash('dash')" title="Ir para o Início"> 
            <div class="btn-toggle-menu" onclick="toggleSidebar()"><i data-lucide="chevron-left"></i></div>
        </div>
        <ul class="nav-links">
            <li><div id="nav-dash" class="nav-link" onclick="mostrarSubPaginaDash('dash')"><i data-lucide="layout-dashboard"></i> <span class="nav-text">Dashboard</span></div></li>
            <li><div id="nav-tiny" class="nav-link" onclick="mostrarSubPaginaDash('tiny')"><i data-lucide="users"></i> <span class="nav-text">Clientes</span></div></li>
            <li><div id="nav-nuvem" class="nav-link" onclick="mostrarSubPaginaDash('nuvem')"><i data-lucide="shopping-cart"></i> <span class="nav-text">Pedidos</span></div></li>
            <li><div class="nav-link"><i data-lucide="truck"></i> <span class="nav-text">Entregas</span></div></li>
            <li onclick="mostrarSubPaginaDash('email')"><div id="nav-email" class="nav-link"><i data-lucide="mail"></i> <span class="nav-text">E-mail</span></div></li>
            <li onclick="mostrarSubPaginaDash('whatsapp')"><div class="nav-link"><i data-lucide="message-circle"></i> <span class="nav-text">WhatsApp</span></div></li>
            <li><div id="nav-rfm" class="nav-link" onclick="mostrarSubPaginaDash('rfm')"><i data-lucide="bar-chart-2"></i> <span class="nav-text">Matriz RFM</span></div></li>
            <li><div id="nav-cep" class="nav-link" onclick="mostrarSubPaginaDash('cep')"><i data-lucide="map"></i> <span class="nav-text">Regiões Logísticas</span></div></li>
            <li><div id="nav-trocas" class="nav-link" onclick="mostrarSubPaginaDash('trocas')"><i data-lucide="refresh-cw"></i> <span class="nav-text">Trocas</span></div></li>
        </ul>
        <div class="sidebar-footer">
            <div class="nav-link" id="nav-config" onclick="mostrarSubPaginaDash('config')"><i data-lucide="settings"></i> <span class="nav-text">Configurações</span></div>
            <div class="nav-link" id="btn-logout"><i data-lucide="log-out"></i> <span class="nav-text">Sair</span></div>
        </div>
    </aside>`;
}

export function getTopbar() {
    return `
    <header class="topbar">
        <div class="page-title-area">
            <h1 id="dash-page-title">Dashboard</h1>
            <p id="dash-page-subtitle">Visão geral do seu e-commerce</p>
        </div>
        <div id="dynamic-top-actions" class="table-top-actions"></div>
    </header>`;
}

export function getDrawer() {
    return `
    <div class="drawer-overlay" id="drawer-overlay" onclick="fecharDetalhesPedido()"></div>
    <div class="drawer-panel" id="drawer-pedido">
        <div class="drawer-header">
            <h2 id="drawer-titulo">Detalhes</h2>
            <button class="btn-close-drawer" onclick="fecharDetalhesPedido()"><i data-lucide="x"></i></button>
        </div>
        <div class="drawer-body" id="drawer-conteudo">
            </div>
    </div>`;
}