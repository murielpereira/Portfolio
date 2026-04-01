import { atualizarIcones, formatarWhatsAppClicavel, formatarDocumento } from './utils.js';
import { getRegrasVIP } from './config.js';

window.todaABaseDeClientes = [];
let paginaAtualRelatorio = 1;
const itensPorPaginaRelatorio = 50;
let colunaOrdenacao = -1;
let ordemCrescente = true;

// ==========================================
// FUNÇÕES DE MATRIZ RFM E GRÁFICOS (MANTIDAS INTACTAS)
// ==========================================
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

export function renderizarGraficoClientes(dadosOpcionais = null) {
    const divGrafico = document.getElementById('grafico-clientes-div');
    if (!divGrafico || typeof google === 'undefined' || !google.visualization) return;
    
    let contagem = { "DIAMANTE": 0, "OURO": 0, "PRATA": 0, "BRONZE": 0, "PRIMEIRA COMPRA": 0 };
    const regras = getRegrasVIP(); 
    
    // Usa a base completa, ou os dados filtrados se forem passados
    const baseParaGrafico = dadosOpcionais || window.todaABaseDeClientes;

    baseParaGrafico.forEach(c => {
        let totalPedidos = parseInt(c.total_pedidos || 0); 
        let valorTotal = parseFloat(c.valor_total || 0);
        
        if (totalPedidos === 1) contagem["PRIMEIRA COMPRA"]++;
        else if (totalPedidos > 1) { 
            if (valorTotal < regras.prata) contagem["BRONZE"]++; 
            else if (valorTotal < regras.ouro) contagem["PRATA"]++; 
            else if (valorTotal < regras.diamante) contagem["OURO"]++; 
            else contagem["DIAMANTE"]++; 
        }
    });
    
    const dadosGrafico = [['Grupo', 'Quantidade'],['Diamante', contagem["DIAMANTE"]],['Ouro', contagem["OURO"]],['Prata', contagem["PRATA"]],['Bronze', contagem["BRONZE"]],['1ª Compra', contagem["PRIMEIRA COMPRA"]]];
    const dataTable = google.visualization.arrayToDataTable(dadosGrafico);
    const options = { title: 'Distribuição de Clientes', pieHole: 0.4, colors: ['#d97706', '#a16207', '#475569', '#c2410c', '#4338ca'], backgroundColor: 'transparent', chartArea: { width: '90%', height: '75%' }, legend: { position: 'right', textStyle: { color: '#475569', fontSize: 13 } } };
    new google.visualization.PieChart(divGrafico).draw(dataTable, options);
}

// ==========================================
// CARREGAMENTO DA BASE E INTELIGÊNCIA DE GRUPOS
// ==========================================
export async function carregarClientesTinyDB() {
    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const data = await resposta.json();
        if (data.sucesso) { 
            const hoje = new Date();
            const regras = getRegrasVIP();

            window.todaABaseDeClientes = data.clientes.map(c => {
                // Inteligência RFM (Mantida)
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

                // Inteligência de Grupo (VIP) em Tempo Real
                let grupoCalculado = "SEM COMPRAS";
                let totalPedidos = parseInt(c.total_pedidos || 0); 
                let valorTotal = parseFloat(c.valor_total || 0); 
                
                if (totalPedidos === 1) grupoCalculado = "PRIMEIRA COMPRA";
                else if (totalPedidos > 1) { 
                    if (valorTotal < regras.prata) grupoCalculado = "BRONZE"; 
                    else if (valorTotal < regras.ouro) grupoCalculado = "PRATA"; 
                    else if (valorTotal < regras.diamante) grupoCalculado = "OURO"; 
                    else grupoCalculado = "DIAMANTE"; 
                }

                return { ...c, rfm_score: {r, f, m}, recenciaDias, segmento_rfm: segmento, grupoCalculado };
            });
            
            resetarEPaginacao(); 
            if(typeof atualizarMetricasDashboard === 'function') atualizarMetricasDashboard();
        } 
    } catch (e) { console.error("Erro ao carregar DB:", e); }
}

// ==========================================
// RENDERIZAÇÃO DA TABELA NOVA (7 COLUNAS E FILTROS V2)
// ==========================================
export function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    
    // Ler os novos IDs dos filtros (Versão modular v2)
    const termoBusca = (document.getElementById("busca-tiny-v2")?.value || "").toLowerCase();
    const filtroGrupo = document.getElementById("filtro-grupo-v2")?.value || "TODOS";
    
    // 1. Filtragem Inteligente
    let dadosFiltrados = window.todaABaseDeClientes.filter(c => {
        const nomeStr = (c.nome || "").toLowerCase(); 
        const cpfStr = (c.cpf || "").replace(/\D/g, '');
        const buscaLimpa = termoBusca.replace(/\D/g, '');

        const passaBusca = termoBusca === "" || nomeStr.includes(termoBusca) || (buscaLimpa !== "" && cpfStr.includes(buscaLimpa));
        const passaGrupo = filtroGrupo === "TODOS" || c.grupoCalculado === filtroGrupo;
        
        return passaBusca && passaGrupo;
    });

    // 2. Atualizar Contador e Gráfico
    const contadorElem = document.getElementById('contador-cadastros');
    if (contadorElem) contadorElem.innerText = `${dadosFiltrados.length} cadastro(s)`;
    renderizarGraficoClientes(dadosFiltrados); // Atualiza o gráfico de pizza filtrado em tempo real

    // 3. Paginação
    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPaginaRelatorio);
    if (paginaAtualRelatorio > totalPaginas && totalPaginas > 0) paginaAtualRelatorio = totalPaginas;
    const inicio = (paginaAtualRelatorio - 1) * itensPorPaginaRelatorio;
    const itensDaPagina = dadosFiltrados.slice(inicio, inicio + itensPorPaginaRelatorio);

    // 4. Desenho da Tabela (7 Colunas)
    tbody.innerHTML = '';
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Nenhum cliente atende aos filtros.</td></tr>';
    } else {
        itensDaPagina.forEach(c => {
            const dataUltima = c.ultima_compra_data ? new Date(c.ultima_compra_data).toLocaleDateString('pt-BR') : '-';
            const pedidoUltimo = c.ultima_compra_pedido ? `#${c.ultima_compra_pedido}` : '';

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer'; 
            tr.onclick = () => abrirDetalhesCliente(c.cpf);

            tr.innerHTML = `
                <td style="font-weight: 500;">${c.nome || '-'}</td>
                <td><span class="badge badge-${c.grupoCalculado.toLowerCase().replace(' ', '')}">${c.grupoCalculado}</span></td>
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
    if(typeof atualizarIcones === 'function') atualizarIcones();
}

// ==========================================
// ORDENAÇÃO COM NOVOS ÍNDICES (0 A 6)
// ==========================================
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
            case 1: valA = a.grupoCalculado; valB = b.grupoCalculado; break;
            case 2: valA = new Date(a.ultima_compra_data || 0).getTime(); valB = new Date(b.ultima_compra_data || 0).getTime(); break;
            case 3: valA = parseInt(a.total_pedidos || 0); valB = parseInt(b.total_pedidos || 0); break;
            case 4: valA = parseFloat(a.ticket_medio || 0); valB = parseFloat(b.ticket_medio || 0); break;
            case 5: valA = parseInt(a.tempo_medio_entrega_dias || 0); valB = parseInt(b.tempo_medio_entrega_dias || 0); break;
            case 6: valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); break;
        }
        if (valA < valB) return ordemCrescente ? -1 : 1;
        if (valA > valB) return ordemCrescente ? 1 : -1;
        return 0;
    });

    for(let i = 0; i <= 6; i++) { 
        const icon = document.getElementById(`sort-icon-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-icon-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescente ? '↑' : '↓'; activeIcon.classList.add('active'); }
    resetarEPaginacao();
}

// ==========================================
// DRAWER LATERAL (O MENU DE DETALHES)
// ==========================================
export function abrirDetalhesCliente(cpf) {
    const cliente = window.todaABaseDeClientes.find(c => c.cpf === cpf);
    if (!cliente) return;

    document.getElementById('drawer-titulo').innerText = `Ficha do Cliente`;
    const telLimpo = (cliente.whatsapp || '').replace(/\D/g, '');
    
    document.getElementById('drawer-conteudo').innerHTML = `
        <div class="detail-header-card">
            <div class="detail-avatar"><i data-lucide="user"></i></div>
            <div class="detail-header-info" style="flex:1;">
                <h3>${cliente.nome}</h3>
                <span class="badge badge-${(cliente.grupoCalculado || '').toLowerCase().replace(' ', '')}">${cliente.grupoCalculado || '-'}</span>
            </div>
        </div>

        <div class="detail-group"><label>WhatsApp</label><p>
            ${telLimpo ? `<a href="https://wa.me/55${telLimpo}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;"><i data-lucide="message-circle" style="width:14px; height:14px;"></i> ${cliente.whatsapp}</a>` : `<span style="color: var(--text-muted);"><i data-lucide="phone" style="width:12px; height:12px;"></i> Não informado</span>`}
        </p></div>
        <div class="detail-group"><label>Documento (CPF/CNPJ)</label><p>${formatarDocumento(cliente.cpf || '-')}</p></div>
        <div class="detail-group"><label>Localização</label><p>${cliente.cidade || '-'} - ${cliente.uf || '-'}</p></div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 25px; background: #fff; padding: 15px; border-radius: 8px; border: 1px dashed var(--border-color);">
            <div class="detail-group" style="margin-bottom:0;"><label>Última Compra</label><p>${cliente.ultima_compra_data ? new Date(cliente.ultima_compra_data).toLocaleDateString('pt-BR') : '-'}</p></div>
            <div class="detail-group" style="margin-bottom:0;"><label>Último Pedido</label><p style="font-weight:600; color:var(--primary);">${cliente.ultima_compra_pedido ? '#' + cliente.ultima_compra_pedido : '-'}</p></div>
        </div>
    `;

    document.getElementById('drawer-overlay').classList.add('active');
    document.getElementById('drawer-pedido').classList.add('active');
    if(typeof atualizarIcones === 'function') atualizarIcones();
}

// ==========================================
// CÁLCULO DE MÉTRICAS DO DASHBOARD EM TEMPO REAL
// ==========================================
export function atualizarMetricasDashboard() {
    // 1. Total de Clientes (Tiny)
    const kpiClientes = document.getElementById('kpi-clientes');
    if (kpiClientes) kpiClientes.innerText = (window.todaABaseDeClientes || []).length.toLocaleString('pt-BR');

    // 2. Pedidos em Aberto e Pendentes (Nuvemshop)
    const pedidos = window.todosOsPedidosNuvem || [];
    let abertos = 0;
    let pendentesEnvio = 0;
    
    pedidos.forEach(p => {
        let st = (p.status_nuvemshop || '').toLowerCase();
        if (st === 'aberto') abertos++;
        if (st === 'enviado' || st === 'shipped') pendentesEnvio++;
    });

    const kpiAbertos = document.getElementById('kpi-abertos');
    if (kpiAbertos) kpiAbertos.innerText = abertos.toLocaleString('pt-BR');
    
    const kpiPendentes = document.getElementById('kpi-pendentes');
    if (kpiPendentes) kpiPendentes.innerText = pendentesEnvio.toLocaleString('pt-BR');

    // 3. Tempo Médio de Envio (Últimos 15 dias)
    const hoje = new Date();
    const quinzeDiasAtras = new Date(hoje.getTime() - (15 * 24 * 60 * 60 * 1000));
    
    let somaDiasEnvio = 0;
    let qtdEnviosValidos = 0;

    pedidos.forEach(p => {
        if (p.data_envio && p.data_criacao) {
            const dataCriacao = new Date(p.data_criacao);
            if (dataCriacao >= quinzeDiasAtras) {
                const d1 = new Date(p.data_criacao);
                const d2 = new Date(p.data_envio);
                const diffDias = Math.max(0, Math.floor((Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate()) - Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())) / (1000 * 60 * 60 * 24)));
                
                somaDiasEnvio += diffDias;
                qtdEnviosValidos++;
            }
        }
    });

    const kpiTempo = document.getElementById('kpi-tempo-envio');
    if (kpiTempo) {
        if (qtdEnviosValidos > 0) {
            let media = (somaDiasEnvio / qtdEnviosValidos).toFixed(1);
            kpiTempo.innerText = `${media} dias`;
        } else {
            kpiTempo.innerText = '-';
        }
    }
}

// ==========================================
// CONTROLES DE PAGINAÇÃO E OUTROS
// ==========================================
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
export function filtrarTabelaPorRFM(segmento) {
    mostrarSubPaginaDash('tiny'); 
    const filtroDropdown = document.getElementById("filtro-grupo-v2");
    if (filtroDropdown) filtroDropdown.value = segmento;
    resetarEPaginacao(); 
}

// PONTE GLOBAL (Tornando as funções visíveis para o HTML)
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
window.abrirDetalhesCliente = abrirDetalhesCliente;
window.atualizarMetricasDashboard = atualizarMetricasDashboard;