import { inicializarIcones, atualizarIcones, inicializarGoogleCharts } from './utils.js';
import { getTemplateLogin, getTemplatePainel } from './templates.js';
import { carregarConfiguracoesDoBanco, preencherFormularioConfig } from './config.js';

// Importando arquivos inteiros para que suas funções "window" sejam ativadas
import './pedidos.js';
import './clientes.js';
import './logistica.js';

inicializarIcones();
inicializarGoogleCharts();

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
            
            await carregarConfiguracoesDoBanco(); 
            mostrarSubPaginaDash('dash'); 
        } else {
            appDiv.innerHTML = getTemplateLogin();
            document.getElementById('form-login')?.addEventListener('submit', realizarLogin);
            document.getElementById('btn-mostrar-senha')?.addEventListener('click', window.toggleSenha);
        }
    } catch (erro) { 
        appDiv.innerHTML = '<p style="text-align:center; padding:50px;">Erro de conexão. Atualize a página.</p>'; 
    }
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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

// Lógica de navegação principal
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
        // As funções abaixo já estão em window graças aos nossos imports
        if (window.todaABaseDeClientes && window.todaABaseDeClientes.length === 0) await window.carregarClientesTinyDB();
        if (window.renderizarGraficoClientes) window.renderizarGraficoClientes(); 
    } else if (idAlvo === 'tiny') {
        document.getElementById('dash-page-title').innerText = "Clientes";
        document.getElementById('dash-page-subtitle').innerText = "Listagem de cadastros";
        topActions.innerHTML = `
            <div class="search-bar"><input type="text" id="filtro-texto" placeholder="Buscar por nome ou CPF..." onkeyup="resetarEPaginacao()"></div>
            <select id="filtro-grupo" class="select-modern" onchange="resetarEPaginacao()"><option value="TODOS">Todos os Grupos</option><option value="DIAMANTE">Diamante</option><option value="OURO">Ouro</option><option value="PRATA">Prata</option><option value="BRONZE">Bronze</option><option value="PRIMEIRA COMPRA">1ª Compra</option><option value="SEM COMPRAS">Sem Compras</option></select>
            <span id="contador-cadastros" class="contador-badge">0 cadastro(s)</span>`;
        if (window.carregarClientesTinyDB) await window.carregarClientesTinyDB();
    } else if (idAlvo === 'nuvem') {
        document.getElementById('dash-page-title').innerText = "Pedidos";
        document.getElementById('dash-page-subtitle').innerText = "Listagem de vendas";
        topActions.innerHTML = `
            <div class="search-bar"><input type="text" id="busca-nuvem" placeholder="Buscar pedido ou cliente..." onkeyup="resetarPaginacaoNuvem()"></div>
            <select id="filtro-status-nuvem" class="select-modern" onchange="resetarPaginacaoNuvem()"><option value="TODOS">Todos os Status</option><option value="Aberto">Aberto</option><option value="Enviado">Enviado</option><option value="Entregue">Entregue</option><option value="Cancelado">Cancelado</option></select>
            <span id="contador-nuvem" class="contador-badge">0 pedido(s)</span>`;
        if (window.carregarPedidosNuvemDB) await window.carregarPedidosNuvemDB();
    } else if (idAlvo === 'rfm') {
        document.getElementById('dash-page-title').innerText = "Matriz RFM";
        document.getElementById('dash-page-subtitle').innerText = "Inteligência de Segmentação";
        if (window.todaABaseDeClientes && window.todaABaseDeClientes.length === 0) await window.carregarClientesTinyDB();
        if (window.renderizarMatrizRFM) window.renderizarMatrizRFM(); 
    } else if (idAlvo === 'cep') { 
        document.getElementById('dash-page-title').innerText = "Desempenho Logístico por Região";
        document.getElementById('dash-page-subtitle').innerText = "Análise de tempo de entrega";
        topActions.innerHTML = `<div class="search-bar"><input type="text" id="busca-cep-analise" placeholder="Filtrar por CEP..." onkeyup="renderizarTabelaCEPs()"></div>`;
        if (window.todosOsPedidosNuvem && window.todosOsPedidosNuvem.length === 0) await window.carregarPedidosNuvemDB(); 
        else if (window.renderizarTabelaCEPs) window.renderizarTabelaCEPs();
    } else if (idAlvo === 'config') {
        document.getElementById('dash-page-title').innerText = "Configurações do Sistema";
        document.getElementById('dash-page-subtitle').innerText = "Personalização de Automações e Variáveis";
        preencherFormularioConfig();
    }
    atualizarIcones();
}

// Vinculando ao HTML
window.mostrarSubPaginaDash = mostrarSubPaginaDash;
window.toggleSidebar = toggleSidebar;