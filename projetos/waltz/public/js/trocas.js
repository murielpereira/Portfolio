import { atualizarIcones } from './utils.js';
import { obterEstadoPorCep } from './logistica.js';

window.listaTrocas = [];

export async function carregarTrocasDB() {
    const tbody = document.getElementById('corpo-tabela-trocas');
    if (!tbody) return;
    try {
        const res = await fetch('/api/trocas');
        const json = await res.json();
        if (json.sucesso) {
            window.listaTrocas = json.dados;
            renderizarTrocas();
            calcularKPIsTrocas();
        }
    } catch (e) {}
}

function renderizarTrocas() {
    const tbody = document.getElementById('corpo-tabela-trocas');
    tbody.innerHTML = '';

    if (window.listaTrocas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Nenhuma ocorrência registrada.</td></tr>';
        return;
    }

    window.listaTrocas.forEach(t => {
        const dataFormatada = new Date(t.data_registro).toLocaleDateString('pt-BR');
        let corPagador = t.frete_pago_por === 'Âme' ? 'badge-semcompra' : (t.frete_pago_por === 'Cliente' ? 'badge-entregue' : 'badge-ouro');
        let tipoBadge = t.tipo_ocorrencia === 'Extravio' ? `<span class="badge" style="background:#fef2f2; color:#ef4444; border-color:#fca5a5; margin-bottom:5px;">🚨 EXTRAVIO</span><br>` : '';
        
        let statusFinanceiro = `<span class="badge ${corPagador}">Frete pago por: ${t.frete_pago_por}</span><br><span style="font-size:11px; color:var(--text-muted);">Canal: ${t.canal}</span>`;
        if (t.tipo_ocorrencia === 'Extravio') {
            if (t.ressarcido === 'Sim') {
                statusFinanceiro = `<span class="badge badge-entregue">Ressarcido: R$ ${t.valor_ressarcido || 0}</span>`;
            } else {
                statusFinanceiro = `<span class="badge badge-aberto" style="color:#ef4444; font-weight:bold;">Aguardando Ressarcimento</span>`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:var(--text-muted);">${dataFormatada}</td>
            <td><div style="font-weight:600; color:var(--primary);">#${t.numero_pedido}</div></td>
            <td style="font-weight:500;">${t.nome_cliente}<br><span style="font-size:11px; color:var(--text-muted);">${t.estado}</span></td>
            <td>${tipoBadge}${t.modelo} <span style="color:var(--text-muted); font-size:11px;">(${t.qtd_pecas}x)</span></td>
            <td>${t.motivo}</td>
            <td style="font-weight:bold;">R$ ${parseFloat(t.valor_frete || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            <td>${statusFinanceiro}</td>
        `;
        tbody.appendChild(tr);
    });
    atualizarIcones();
}

function calcularKPIsTrocas() {
    if (window.listaTrocas.length === 0) return;
    document.getElementById('kpi-trocas-qtd').innerText = window.listaTrocas.length;

    const custoAme = window.listaTrocas.filter(t => t.frete_pago_por === 'Âme').reduce((acc, t) => acc + parseFloat(t.valor_frete || 0), 0);
    document.getElementById('kpi-trocas-custo').innerText = `R$ ${custoAme.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;

    let contagemProdutos = {};
    let pendentesRessarcimento = 0;

    window.listaTrocas.forEach(t => {
        if (t.modelo && t.tipo_ocorrencia !== 'Extravio') contagemProdutos[t.modelo] = (contagemProdutos[t.modelo] || 0) + 1;
        if (t.tipo_ocorrencia === 'Extravio' && t.ressarcido === 'Nao') pendentesRessarcimento++;
    });

    const produtoProblema = Object.keys(contagemProdutos).length > 0 ? Object.keys(contagemProdutos).reduce((a, b) => contagemProdutos[a] > contagemProdutos[b] ? a : b) : '-';
    document.getElementById('kpi-trocas-produto').innerText = produtoProblema;
    document.getElementById('kpi-trocas-extravio').innerText = pendentesRessarcimento;
}

export function abrirModalTroca() {
    document.getElementById('form-nova-troca').reset();
    document.getElementById('tr-aviso-pedido').style.display = 'none';
    document.getElementById('tr-modelos-container').innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Busque um pedido primeiro para listar os produtos...</div>';
    document.getElementById('tr-modelo').value = '';
    toggleCamposExtravio();
    document.getElementById('modal-troca').classList.add('active');
}

export function fecharModalTroca() { document.getElementById('modal-troca').classList.remove('active'); }

export function toggleCamposExtravio() {
    const tipo = document.getElementById('tr-tipo').value;
    const box = document.getElementById('box-extravio');
    if (tipo === 'Extravio') {
        box.style.display = 'block';
        document.getElementById('tr-pagador').value = 'Transportadora'; 
    } else { box.style.display = 'none'; }
}

function atualizarInputModeloEscondido() {
    const checkboxes = document.querySelectorAll('.chk-produto-troca:checked');
    const values = Array.from(checkboxes).map(cb => cb.value);
    document.getElementById('tr-modelo').value = values.join(' + ');
}

export async function preencherDadosPedidoTroca() {
    const numPedido = document.getElementById('tr-pedido').value;
    const aviso = document.getElementById('tr-aviso-pedido');
    if (!numPedido) return;

    if (!window.todosOsPedidosNuvem || window.todosOsPedidosNuvem.length === 0) {
        if (window.carregarPedidosNuvemDB) await window.carregarPedidosNuvemDB();
    }

    const pedidoEncontrado = window.todosOsPedidosNuvem.find(p => p.numero_pedido == numPedido);

    if (pedidoEncontrado) {
        document.getElementById('tr-cliente').value = pedidoEncontrado.nome_cliente || 'Desconhecido';
        document.getElementById('tr-estado').value = pedidoEncontrado.estado || obterEstadoPorCep(pedidoEncontrado.cep) || 'ND';
        aviso.style.display = 'none';

        const containerModelos = document.getElementById('tr-modelos-container');
        containerModelos.innerHTML = ''; 

        if (pedidoEncontrado.produtos && pedidoEncontrado.produtos.trim() !== '') {
            // FIX: Identifica qual separador o sistema usou (o novo ' || ' ou o antigo ', ')
            const separador = pedidoEncontrado.produtos.includes(' || ') ? ' || ' : (pedidoEncontrado.produtos.includes(', ') ? ', ' : ',');
            const arrProds = pedidoEncontrado.produtos.split(separador);
            
            arrProds.forEach((prod) => {
                if(!prod.trim()) return;
                const label = document.createElement('label');
                label.style.display = 'flex'; label.style.alignItems = 'center'; label.style.gap = '8px'; label.style.marginBottom = '6px'; label.style.cursor = 'pointer'; label.style.fontSize = '13px';
                
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.value = prod.trim(); cb.className = 'chk-produto-troca';
                cb.onchange = atualizarInputModeloEscondido;
                
                label.appendChild(cb); label.appendChild(document.createTextNode(prod.trim()));
                containerModelos.appendChild(label);
            });
            
            const hr = document.createElement('hr'); hr.style.margin = '10px 0'; hr.style.borderColor = 'var(--border-color)';
            containerModelos.appendChild(hr);
            
            const labelAll = document.createElement('label');
            labelAll.style.display = 'flex'; labelAll.style.alignItems = 'center'; labelAll.style.gap = '8px'; labelAll.style.cursor = 'pointer'; labelAll.style.fontSize = '13px'; labelAll.style.fontWeight = 'bold';
            const cbAll = document.createElement('input');
            cbAll.type = 'checkbox'; cbAll.value = "Pedido Completo"; cbAll.className = 'chk-produto-troca'; cbAll.onchange = atualizarInputModeloEscondido;
            labelAll.appendChild(cbAll); labelAll.appendChild(document.createTextNode("⭐ Pedido Completo (Todos os itens)"));
            containerModelos.appendChild(labelAll);

        } else {
            containerModelos.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Produto não especificado via API. Descreva no motivo.</div>';
        }
        document.getElementById('tr-modelo').value = ""; 
    } else {
        document.getElementById('tr-cliente').value = '';
        document.getElementById('tr-estado').value = '';
        document.getElementById('tr-modelos-container').innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Avulso / Digite manualmente na observação</div>';
        document.getElementById('tr-modelo').value = "Não listado / Avulso";
        aviso.style.display = 'block';
    }
}

export async function salvarNovaTroca(event) {
    event.preventDefault();
    
    const modeloSelecionado = document.getElementById('tr-modelo').value;
    if (!modeloSelecionado || modeloSelecionado.trim() === '') {
        alert("Por favor, selecione pelo menos um item da lista de produtos!");
        return;
    }

    const dados = {
        numero_pedido: document.getElementById('tr-pedido').value,
        nome_cliente: document.getElementById('tr-cliente').value || 'Avulso',
        estado: document.getElementById('tr-estado').value || 'ND',
        modelo: modeloSelecionado,
        qtd_pecas: document.getElementById('tr-qtd').value,
        valor_pecas: document.getElementById('tr-valor').value,
        valor_frete: document.getElementById('tr-frete').value || 0,
        frete_pago_por: document.getElementById('tr-pagador').value,
        canal: document.getElementById('tr-canal').value,
        motivo: document.getElementById('tr-motivo').value,
        tipo_ocorrencia: document.getElementById('tr-tipo').value,
        ressarcido: document.getElementById('tr-tipo').value === 'Extravio' ? document.getElementById('tr-ressarcido').value : 'Nao',
        valor_ressarcido: document.getElementById('tr-tipo').value === 'Extravio' ? (document.getElementById('tr-valor-ressarcido').value || 0) : 0
    };

    try {
        const res = await fetch('/api/trocas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
        if (res.ok) { fecharModalTroca(); carregarTrocasDB(); } 
        else { alert('Erro ao salvar no banco de dados.'); }
    } catch (e) { alert('Erro de conexão.'); }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal-troca');
        if (modal && modal.classList.contains('active')) fecharModalTroca();
    }
});

window.abrirModalTroca = abrirModalTroca;
window.fecharModalTroca = fecharModalTroca;
window.preencherDadosPedidoTroca = preencherDadosPedidoTroca;
window.salvarNovaTroca = salvarNovaTroca;
window.carregarTrocasDB = carregarTrocasDB;
window.toggleCamposExtravio = toggleCamposExtravio;