import { atualizarIcones, formatarDocumento } from './utils.js';
import { configsGlobais } from './config.js';

window.todosOsPedidosNuvem = [];
let paginaAtualNuvem = 1;
const itensPorPaginaNuvem = 50;

let colunaOrdenacaoNuvem = -1;
let ordemCrescenteNuvem = true;

export async function carregarPedidosNuvemDB() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Carregando pedidos...</td></tr>';
    try {
        const resposta = await fetch('/api/pedidos');
        window.todosOsPedidosNuvem = await resposta.json();
        resetarPaginacaoNuvem();
    } catch (e) {}
}

export function renderizarPaginaNuvem() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    
    const termoBusca = (document.getElementById("busca-nuvem-v2")?.value || "").toLowerCase();
    const filtroStatus = document.getElementById("filtro-status-v2")?.value || "TODOS";
    const filtroAutomacao = document.getElementById("filtro-automacao-v2")?.value || "TODOS";
    
    let dadosFiltrados = window.todosOsPedidosNuvem.map(p => {
        let pedidoProcessado = { ...p };
        let stOriginal = (pedidoProcessado.status_nuvemshop || '').toLowerCase();
        let stFinal = 'Aberto'; 

        if (stOriginal === 'closed' || stOriginal === 'arquivado' || stOriginal === 'delivered' || stOriginal === 'entregue') {
            stFinal = 'Entregue';
        } else if (stOriginal === 'shipped' || stOriginal === 'enviado') {
            stFinal = 'Enviado';
        } else if (stOriginal === 'canceled' || stOriginal === 'cancelled' || stOriginal === 'cancelado') {
            stFinal = 'Cancelado';
        }

        pedidoProcessado.status_nuvemshop = stFinal;
        return pedidoProcessado;

    }).filter(p => {
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
            const dataF = dataO.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' <br><span style="font-size:11px">' + dataO.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' }) + '</span>';
            
            const stNuvem = p.status_nuvemshop.toUpperCase();
            
            // LÓGICA DE TEXTO DA TABELA ESTRITAMENTE BASEADA NOS DISPAROS
            let step = 0;
            let ultimoStatusTexto = "Aguardando Automação...";
            
            if (p.auto_aprovado === true) { step = 1; ultimoStatusTexto = "1. Pedido Aprovado"; }
            if (p.auto_fabricacao === true) { step = 2; ultimoStatusTexto = "2. Em Fabricação"; }
            if (p.auto_rastreio === true) { step = 3; ultimoStatusTexto = "3. Rastreio Enviado"; }
            if (p.auto_entrega === true) { step = 4; ultimoStatusTexto = "4. Em Rota / Entregue"; }
            if (p.status_feedback === 'Enviado') { step = 5; ultimoStatusTexto = "5. Feedback Concluído"; }

            let corTexto = step > 0 ? 'var(--primary)' : 'var(--text-muted)';
            let acaoComunicacao = `<span style="font-size: 13px; font-weight: 600; color: ${corTexto};">${ultimoStatusTexto}</span>`;
            
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
                <td>${statusBadge}</td>
                <td>${acaoComunicacao}</td>
            `;
            tbody.appendChild(linha);
        });
    }
    renderizarControlesPaginacaoNuvem(totalPaginas);
    atualizarIcones(); 
}

export function abrirDetalhesPedido(idPedido) {
    const pedido = window.todosOsPedidosNuvem.find(p => p.id_pedido === idPedido);
    if (!pedido) return;

    document.getElementById('drawer-titulo').innerText = `Pedido #${pedido.numero_pedido}`;

    let tempoTexto = 'Aguardando envio';
    if (pedido.data_envio && pedido.data_entrega) {
        const d1 = new Date(pedido.data_envio);
        const d2 = new Date(pedido.data_entrega);
        const diffDias = Math.floor((Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate()) - Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())) / (1000 * 60 * 60 * 24));
        tempoTexto = diffDias === 0 ? 'Entregue no mesmo dia' : `${diffDias} dia(s)`;
    } else if (pedido.data_envio) tempoTexto = 'Em andamento';

    const telLimpo = (pedido.telefone || '').replace(/\D/g, '');
    let urlRastreioBase = '';
    let htmlRastreio = `<p style="font-family: monospace; color: var(--text-muted); font-size: 15px;">Aguardando envio...</p>`;
    
    if (pedido.rastreio && pedido.rastreio.trim() !== '') {
        urlRastreioBase = `https://portal.smartenvios.com/rastreamento/codigo-de-rastreio/${pedido.rastreio}`; 
        htmlRastreio = `<a href="${urlRastreioBase}" target="_blank" style="font-family: monospace; color: var(--primary); font-weight: 600; font-size: 15px; text-decoration: underline; display: inline-flex; align-items: center; gap: 5px;" title="Rastrear Encomenda">${pedido.rastreio} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>`;
    }

    const stNuvem = (pedido.status_nuvemshop || 'Aberto').toUpperCase();
    let corBadge = stNuvem === 'ENTREGUE' ? 'badge-entregue' : (stNuvem === 'ENVIADO' ? 'badge-ouro' : (stNuvem === 'CANCELADO' ? 'badge-semcompra' : 'badge-aberto'));
    let statusBadge = `<span class="badge ${corBadge}">${stNuvem}</span>`;

    const formatarData = (dataBase) => {
        if (!dataBase) return '-';
        const d = new Date(dataBase);
        return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' <span style="font-size:11px; color:var(--text-muted)">' + d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' }) + '</span>';
    };

    let templates = {
        aprovado: "Olá {nome}! Seu pedido #{pedido} foi aprovado com sucesso e já estamos preparando tudo com muito carinho. 🐶💙",
        fabricacao: "Boas notícias, {nome}! Os itens do seu pedido #{pedido} acabaram de entrar em produção.",
        rastreio: "{nome}, sua encomenda foi despachada! 🚚 Rastreio: {rastreio}. Acompanhe por aqui: {link_rastreio}",
        rota: "Atenção, {nome}! O carteiro saiu para entrega. Fique de olho, o seu pedido #{pedido} chega hoje! 📦✨",
        feedback: "Olá {nome}, vimos que seu pedido chegou! O que achou dos produtos? Seu feedback é muito importante para nós! 🥰"
    };
    
    if (configsGlobais && configsGlobais.templates_wpp) {
        templates = { ...templates, ...configsGlobais.templates_wpp };
    }

    const primeiroNome = (pedido.nome_cliente || 'Cliente').split(' ')[0];
    const trackCode = pedido.rastreio || 'Aguardando rastreio';

    const gerarLinkWpp = (templateText) => {
        if (!telLimpo) return '#'; 
        // FIX: Variável {produtos} adicionada
        let textoFinal = templateText.replace(/{nome}/g, primeiroNome).replace(/{pedido}/g, pedido.numero_pedido).replace(/{rastreio}/g, trackCode).replace(/{link_rastreio}/g, urlRastreioBase).replace(/{produtos}/g, pedido.produtos || 'seus itens');
        return `https://wa.me/55${telLimpo}?text=${encodeURIComponent(textoFinal)}`;
    };

    // LÓGICA DE STEPPER
    let isAprovadoDone = pedido.auto_aprovado === true;
    let isFabDone = pedido.auto_fabricacao === true;
    let isRastreioDone = pedido.auto_rastreio === true;
    let isRotaDone = pedido.auto_entrega === true;
    let isFeedbackDone = pedido.status_feedback === 'Enviado';

    let lastCompletedStep = 0;
    if (isAprovadoDone) lastCompletedStep = 1;
    if (isFabDone) lastCompletedStep = 2;
    if (isRastreioDone) lastCompletedStep = 3;
    if (isRotaDone) lastCompletedStep = 4;
    if (isFeedbackDone) lastCompletedStep = 5;

    const createStep = (isDone, title, subtitle, msgTemplate) => {
        const color = isDone ? '#10b981' : '#cbd5e1';
        // FIX: Fundo #f8fafc ao invés de transparent para tapar a linha de fundo
        const bg = isDone ? '#10b981' : '#f8fafc';
        const icon = isDone ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ``;
        const linkWpp = gerarLinkWpp(msgTemplate);
        const btnWppHtml = telLimpo ? `<a href="${linkWpp}" target="_blank" style="margin-left: auto; background: #25d366; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: flex; align-items: center; gap: 4px; transition: opacity 0.2s;" title="Enviar mensagem desta etapa"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Enviar</a>` : ``;

        return `
        <div style="display:flex; gap:12px; align-items:center; z-index:3; position:relative; background:transparent; padding:4px 0; width:100%;">
            <div style="width:24px; height:24px; border-radius:50%; border:2px solid ${color}; background:${bg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${icon}</div>
            <div style="display:flex; flex-direction:column;">
                <span style="font-size:13px; font-weight:700; color:var(--text-main);">${title}</span>
                <span style="font-size:11px; color:var(--text-muted);">${subtitle}</span>
            </div>
            ${btnWppHtml}
        </div>`;
    };

    const conteudo = document.getElementById('drawer-conteudo');
    conteudo.innerHTML = `
        <div class="detail-header-card">
            <div class="detail-avatar"><i data-lucide="user"></i></div>
            <div class="detail-header-info" style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;"><h3>${pedido.nome_cliente || '-'}</h3>${statusBadge}</div>
                <p style="margin-top:5px;">${pedido.telefone ? `<a href="https://wa.me/55${telLimpo}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;"><i data-lucide="message-circle" style="width:14px; height:14px;"></i> ${pedido.telefone}</a>` : `<span style="color: var(--text-muted);"><i data-lucide="phone" style="width:12px; height:12px;"></i> Sem telefone</span>`}</p>
                <p><i data-lucide="mail" style="width:12px; height:12px;"></i> ${pedido.email_cliente || 'Sem e-mail'}</p>
            </div>
        </div>

        <div class="detail-group" style="margin-bottom: 30px; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid var(--border-color);">
            <label>Progresso das Automações</label>
            <div style="position:relative; display:flex; flex-direction:column; gap:15px; margin-top:15px;">
                <div style="position:absolute; left:11px; top:12px; bottom:12px; width:2px; background:var(--border-color); z-index:1;"></div>
                
                <div style="position:absolute; left:11px; top:12px; height:calc(${(Math.max(0, lastCompletedStep - 1) / 4)} * (100% - 24px)); width:2px; background:#10b981; z-index:2; transition:height 0.8s ease-in-out;"></div>
                
                ${createStep(isAprovadoDone, "1. Pedido Aprovado", "Confirmação do pagamento", templates.aprovado)}
                ${createStep(isFabDone, "2. Em Fabricação", "Peça entrou em produção", templates.fabricacao)}
                ${createStep(isRastreioDone, "3. Código de Rastreio", "Envio do link da transportadora", templates.rastreio)}
                ${createStep(isRotaDone, "4. Rota de Entrega", "Aviso de entrega no dia", templates.rota)}
                ${createStep(isFeedbackDone, "5. Feedback", "Pesquisa de satisfação", templates.feedback)}
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #fff; padding: 15px; border-radius: 8px; border: 1px dashed var(--border-color);">
            <div class="detail-group" style="margin-bottom:0;"><label>Data da Compra</label><p>${formatarData(pedido.data_criacao)}</p></div>
            <div class="detail-group" style="margin-bottom:0;"><label>Data de Envio</label><p>${formatarData(pedido.data_envio)}</p></div>
            <div class="detail-group" style="margin-bottom:0;"><label>Data de Entrega</label><p>${formatarData(pedido.data_entrega)}</p></div>
            <div class="detail-group" style="margin-bottom:0;"><label>Tempo Logístico</label><p style="font-weight:600; color:var(--primary);">${tempoTexto}</p></div>
        </div>

        <div class="detail-group"><label>Documento (CPF/CNPJ)</label><p>${formatarDocumento(pedido.cpf_cliente || '-')}</p></div>
        <div class="detail-group"><label>Endereço de Entrega</label><p>${pedido.endereco_completo || 'Endereço não capturado'}</p><p style="color:var(--text-muted); font-size:13px; margin-top:2px;">${pedido.cidade || '-'} - ${pedido.estado || '-'} (${pedido.cep || 'Sem CEP'})</p></div>
        <div class="detail-group"><label>Transportadora</label><p>${pedido.transportadora || '-'}</p></div>
        <div class="detail-group" style="margin-bottom:0;"><label>Código de Rastreio</label>${htmlRastreio}</div>
    `;

    document.getElementById('drawer-overlay').classList.add('active');
    document.getElementById('drawer-pedido').classList.add('active');
    atualizarIcones();
}

export function fecharDetalhesPedido() {
    document.getElementById('drawer-overlay').classList.remove('active');
    document.getElementById('drawer-pedido').classList.remove('active');
}

export function renderizarControlesPaginacaoNuvem(totalPaginas) {
    const container = document.getElementById('paginacao-nuvem');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    let html = `<button class="btn-pag-nav" onclick="irParaPaginaNuvem(1)">«</button><button class="btn-pag-nav" onclick="mudarPaginaNuvem(-1)">‹</button>`;
    for (let i = Math.max(1, paginaAtualNuvem - 2); i <= Math.min(totalPaginas, Math.max(1, paginaAtualNuvem - 2) + 4); i++) html += `<button class="${i === paginaAtualNuvem ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPaginaNuvem(${i})">${i}</button>`;
    html += `<button class="btn-pag-nav" onclick="mudarPaginaNuvem(1)">›</button><button class="btn-pag-nav" onclick="irParaPaginaNuvem(${totalPaginas})">»</button>`;
    container.innerHTML = html;
}

export function mudarPaginaNuvem(delta) { paginaAtualNuvem += delta; renderizarPaginaNuvem(); }
export function irParaPaginaNuvem(pagina) { paginaAtualNuvem = pagina; renderizarPaginaNuvem(); }
export function resetarPaginacaoNuvem() { paginaAtualNuvem = 1; renderizarPaginaNuvem(); }

export function ordenarTabelaNuvem(colIndex) {
    if (colunaOrdenacaoNuvem === colIndex) {
        ordemCrescenteNuvem = !ordemCrescenteNuvem; 
    } else { 
        colunaOrdenacaoNuvem = colIndex; 
        ordemCrescenteNuvem = true; 
    }
    
    window.todosOsPedidosNuvem.sort((a, b) => {
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

    for(let i = 0; i <= 3; i++) { 
        const icon = document.getElementById(`sort-nuvem-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-nuvem-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescenteNuvem ? '↑' : '↓'; activeIcon.classList.add('active'); }
    
    resetarPaginacaoNuvem();
}

window.ordenarTabelaNuvem = ordenarTabelaNuvem;
window.resetarPaginacaoNuvem = resetarPaginacaoNuvem;
window.irParaPaginaNuvem = irParaPaginaNuvem;
window.mudarPaginaNuvem = mudarPaginaNuvem;
window.abrirDetalhesPedido = abrirDetalhesPedido;
window.fecharDetalhesPedido = fecharDetalhesPedido;
window.carregarPedidosNuvemDB = carregarPedidosNuvemDB;
window.todosOsPedidosNuvem = window.todosOsPedidosNuvem || [];
window.carregarPedidosNuvemDB = carregarPedidosNuvemDB;