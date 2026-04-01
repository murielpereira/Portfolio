import { formatarWhatsAppClicavel, formatarDocumento } from './utils.js';
import { getRegrasVIP } from './config.js';

window.todaABaseDeClientes = [];
let paginaAtualRelatorio = 1;
const itensPorPaginaRelatorio = 50;
let colunaOrdenacao = -1;
let ordemCrescente = true;

export function renderizarMatrizRFM() {
    if (window.todaABaseDeClientes.length === 0) return;

    let somaLTV = 0, somaFreq = 0, somaRecencia = 0, clientesComCompra = 0;
    let campeoes = 0, fieis = 0, recentes = 0, risco = 0;

    window.todaABaseDeClientes.forEach(c => {
        if (c.segmento_rfm === "SEM COMPRAS") return;
        somaLTV += parseFloat(c.valor_total || 0);
        somaFreq += parseInt(c.total_pedidos || 0);
        somaRecencia += c.recenciaDias; 
        clientesComCompra++;

        if (c.segmento_rfm === "CAMPEOES") campeoes++;
        else if (c.segmento_rfm === "FIEIS") fieis++;
        else if (c.segmento_rfm === "RECENTES") recentes++;
        else if (c.segmento_rfm === "RISCO") risco++;
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

export function renderizarGraficoClientes() {
    const divGrafico = document.getElementById('grafico-clientes-div');
    if (!divGrafico || typeof google === 'undefined' || !google.visualization) return;
    
    let contagem = { "DIAMANTE": 0, "OURO": 0, "PRATA": 0, "BRONZE": 0, "PRIMEIRA COMPRA": 0 };
    const regras = getRegrasVIP(); 
    
    window.todaABaseDeClientes.forEach(c => {
        let totalPedidos = c.total_pedidos || 0; 
        let valorTotal = parseFloat(c.valor_total || 0);
        
        if (totalPedidos === 1) contagem["PRIMEIRA COMPRA"]++;
        else if (totalPedidos > 1) { 
            if (valorTotal <= regras.prata) contagem["BRONZE"]++; 
            else if (valorTotal <= regras.ouro) contagem["PRATA"]++; 
            else if (valorTotal <= regras.diamante) contagem["OURO"]++; 
            else contagem["DIAMANTE"]++; 
        }
    });
    
    const dadosGrafico = [['Grupo', 'Quantidade'],['Diamante', contagem["DIAMANTE"]],['Ouro', contagem["OURO"]],['Prata', contagem["PRATA"]],['Bronze', contagem["BRONZE"]],['1ª Compra', contagem["PRIMEIRA COMPRA"]]];
    const dataTable = google.visualization.arrayToDataTable(dadosGrafico);
    const options = { title: 'Distribuição de Clientes', pieHole: 0.4, colors: ['#d97706', '#a16207', '#475569', '#c2410c', '#4338ca'], backgroundColor: 'transparent', chartArea: { width: '90%', height: '75%' }, legend: { position: 'right', textStyle: { color: '#475569', fontSize: 13 } } };
    new google.visualization.PieChart(divGrafico).draw(dataTable, options);
}

export async function carregarClientesTinyDB() {
    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const data = await resposta.json();
        if (data.sucesso) { 
            const hoje = new Date();
            window.todaABaseDeClientes = data.clientes.map(c => {
                let r = 1, f = 1, m = 1;
                let recenciaDias = 999;
                if (c.ultima_compra) recenciaDias = Math.ceil(Math.abs(hoje - new Date(c.ultima_compra)) / (1000 * 60 * 60 * 24));
                if (recenciaDias <= 30) r = 5; else if (recenciaDias <= 90) r = 4; else if (recenciaDias <= 180) r = 3; else if (recenciaDias <= 365) r = 2; else r = 1;
                if (c.total_pedidos >= 5) f = 5; else if (c.total_pedidos >= 3) f = 4; else if (c.total_pedidos === 2) f = 3; else if (c.total_pedidos === 1) f = 1; else f = 0;
                if (c.valor_total >= 3000) m = 5; else if (c.valor_total >= 1000) m = 4; else if (c.valor_total >= 500) m = 3; else if (c.valor_total > 0) m = 2; else m = 0;
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

export function filtrarTabelaPorRFM(segmento) {
    mostrarSubPaginaDash('tiny'); 
    const filtroDropdown = document.getElementById("filtro-grupo");
    if (filtroDropdown) filtroDropdown.value = segmento;
    resetarEPaginacao(); 
}

export function classificarClienteVisual(totalPedidos, valorTotal) {
    if (totalPedidos === 0) return '<span class="badge badge-semcompra">SEM COMPRAS</span>';
    if (totalPedidos === 1) return '<span class="badge badge-primeiracompra">1ª COMPRA</span>';
    const regras = getRegrasVIP();
    if (valorTotal > regras.diamante) return '<span class="badge badge-diamante">DIAMANTE</span>';
    if (valorTotal > regras.ouro) return '<span class="badge badge-ouro">OURO</span>';
    if (valorTotal > regras.prata) return '<span class="badge badge-prata">PRATA</span>';
    return '<span class="badge badge-bronze">BRONZE</span>';
}

export function ordenarTabela(colIndex) {
    if (colunaOrdenacao === colIndex) {
        ordemCrescente = !ordemCrescente; 
    } else { 
        colunaOrdenacao = colIndex; 
        ordemCrescente = true; 
    }
    
    window.todaABaseDeClientes.sort((a, b) => {
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

    for(let i = 0; i <= 9; i++) { 
        const icon = document.getElementById(`sort-icon-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-icon-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescente ? '↑' : '↓'; activeIcon.classList.add('active'); }
    resetarEPaginacao();
}

export function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    const termoBusca = (document.getElementById("busca-tiny-v2")?.value || "").toLowerCase();
    const filtroGrupo = document.getElementById("filtro-grupo-v2")?.value || "TODOS";
    
    let dadosFiltrados = window.todaABaseDeClientes.filter(c => {
        const nomeStr = (c.nome || "").toLowerCase(); const cpfStr = (c.cpf || "").toLowerCase();
        if (termoBusca !== "" && !nomeStr.includes(termoBusca) && !cpfStr.includes(termoBusca)) return false;
        
        if (filtroGrupo !== "TODOS") {
            let totalPedidos = c.total_pedidos || 0; 
            let valorTotal = parseFloat(c.valor_total || 0); 
            let grupoReal = "SEM COMPRAS";
            const regras = getRegrasVIP(); 
            
            if (totalPedidos === 1) grupoReal = "PRIMEIRA COMPRA";
            else if (totalPedidos > 1) { 
                if (valorTotal <= regras.prata) grupoReal = "BRONZE"; 
                else if (valorTotal <= regras.ouro) grupoReal = "PRATA"; 
                else if (valorTotal <= regras.diamante) grupoReal = "OURO"; 
                else grupoReal = "DIAMANTE"; 
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
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Nenhum cliente atende aos filtros.</td></tr>';
    } else {
        itensDaPagina.forEach(c => {
            // Formata as datas para a nova coluna "Último Pedido"
            const dataUltima = c.ultima_compra_data ? new Date(c.ultima_compra_data).toLocaleDateString('pt-BR') : '-';
            const pedidoUltimo = c.ultima_compra_pedido ? `#${c.ultima_compra_pedido}` : '';

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer'; 
            tr.onclick = () => abrirDetalhesCliente(c.cpf); // Abre o menu lateral

            // As 7 exatas colunas do nosso novo Design
            tr.innerHTML = `
                <td style="font-weight: 500;">${c.nome || '-'}</td>
                <td><span class="badge badge-${(c.grupo || '').toLowerCase().replace(' ', '')}">${c.grupo || '-'}</span></td>
                <td>
                    <div style="font-weight:600; color:var(--primary);">${pedidoUltimo}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${dataUltima}</div>
                </td>
                <td>${c.total_pedidos || 0}</td>
                <td>R$ ${parseFloat(c.ticket_medio || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${c.tempo_medio_entrega_dias ? c.tempo_medio_entrega_dias + ' dias' : '-'}</td>
                <td style="font-weight: bold;">R$ ${parseFloat(c.valor_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    renderizarControlesPaginacao(totalPaginas);
}

export function renderizarControlesPaginacao(totalPaginas) {
    const container = document.getElementById('paginacao-ltv');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    let html = `<button class="btn-pag-nav" onclick="irParaPagina(1)">«</button><button class="btn-pag-nav" onclick="mudarPagina(-1)">‹</button>`;
    for (let i = Math.max(1, paginaAtualRelatorio - 2); i <= Math.min(totalPaginas, Math.max(1, paginaAtualRelatorio - 2) + 4); i++) html += `<button class="${i === paginaAtualRelatorio ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPagina(${i})">${i}</button>`;
    html += `<button class="btn-pag-nav" onclick="mudarPagina(1)">›</button><button class="btn-pag-nav" onclick="irParaPagina(${totalPaginas})">»</button>`;
    container.innerHTML = html;
}

export function mudarPagina(delta) { paginaAtualRelatorio += delta; renderizarPaginaRelatorio(); }
export function irParaPagina(pagina) { paginaAtualRelatorio = pagina; renderizarPaginaRelatorio(); }
export function resetarEPaginacao() { paginaAtualRelatorio = 1; renderizarPaginaRelatorio(); }

// ==========================================
// PONTE GLOBAL (Tornando as funções visíveis para o HTML e app.js)
// ==========================================
window.todaABaseDeClientes = window.todaABaseDeClientes || []; 
window.ordenarTabela = ordenarTabela;
window.resetarEPaginacao = resetarEPaginacao;
window.irParaPagina = irParaPagina;
window.mudarPagina = mudarPagina;
window.filtrarTabelaPorRFM = filtrarTabelaPorRFM;
window.renderizarPaginaRelatorio = renderizarPaginaRelatorio;
window.renderizarGraficoClientes = renderizarGraficoClientes;
window.carregarClientesTinyDB = carregarClientesTinyDB;
window.renderizarMatrizRFM = renderizarMatrizRFM;

window.abrirDetalhesCliente = function(cpf) {
    const cliente = window.todosOsClientes.find(c => c.cpf === cpf);
    if (!cliente) return;

    document.getElementById('drawer-titulo').innerText = `Ficha do Cliente`;
    
    // Reaproveitamos a estrutura visual do Drawer de pedidos
    document.getElementById('drawer-conteudo').innerHTML = `
        <div class="detail-header-card">
            <div class="detail-avatar"><i data-lucide="user"></i></div>
            <div class="detail-header-info" style="flex:1;">
                <h3>${cliente.nome}</h3>
                <span class="badge badge-${(cliente.grupo || '').toLowerCase().replace(' ', '')}">${cliente.grupo || '-'}</span>
            </div>
        </div>

        <div class="detail-group"><label>WhatsApp</label><p style="font-weight:600; color:var(--primary);">${cliente.whatsapp || 'Não informado'}</p></div>
        <div class="detail-group"><label>Documento (CPF/CNPJ)</label><p>${cliente.cpf || '-'}</p></div>
        <div class="detail-group"><label>Localização</label><p>${cliente.cidade || '-'} - ${cliente.uf || '-'}</p></div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 25px; background: #fff; padding: 15px; border-radius: 8px; border: 1px dashed var(--border-color);">
            <div class="detail-group" style="margin-bottom:0;"><label>Última Compra</label><p>${cliente.ultima_compra_data ? new Date(cliente.ultima_compra_data).toLocaleDateString('pt-BR') : '-'}</p></div>
            <div class="detail-group" style="margin-bottom:0;"><label>Último Pedido</label><p style="font-weight:600;">${cliente.ultima_compra_pedido ? '#' + cliente.ultima_compra_pedido : '-'}</p></div>
        </div>
    `;

    document.getElementById('drawer-overlay').classList.add('active');
    document.getElementById('drawer-pedido').classList.add('active');
    if (typeof atualizarIcones === 'function') atualizarIcones();
};