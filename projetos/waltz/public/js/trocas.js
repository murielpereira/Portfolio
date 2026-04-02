import { atualizarIcones } from './utils.js';

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
    document.getElementById('tr-modelo').innerHTML = '<option value="">Busque um pedido primeiro para listar os produtos...</option>';
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
    } else {
        box.style.display = 'none';
    }
}

// Mágica 2.0: Popula os produtos do pedido
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
        document.getElementById('tr-estado').value = pedidoEncontrado.estado || 'ND';
        aviso.style.display = 'none';

        const selectModelo = document.getElementById('tr-modelo');
        selectModelo.innerHTML = ''; 

        if (pedidoEncontrado.produtos && pedidoEncontrado.produtos.trim() !== '') {
            const produtos = pedidoEncontrado.produtos.split(',');
            produtos.forEach(prod => {
                const opt = document.createElement('option');
                opt.value = prod.trim();
                opt.innerText = prod.trim();
                selectModelo.appendChild(opt);
            });
            const optAll = document.createElement('option');
            optAll.value = "Pedido Completo (Todos os itens)";
            optAll.innerText = "⭐ Pedido Completo (Todos os itens)";
            selectModelo.appendChild(optAll);
        } else {
            selectModelo.innerHTML = '<option value="Produto não especificado via API">Produto não especificado via API</option>';
        }
    } else {
        document.getElementById('tr-cliente').value = '';
        document.getElementById('tr-estado').value = '';
        document.getElementById('tr-modelo').innerHTML = '<option value="Avulso / Não listado">Avulso / Digite manualmente na observação</option>';
        aviso.style.display = 'block';
    }
}

export async function salvarNovaTroca(event) {
    event.preventDefault();
    const dados = {
        numero_pedido: document.getElementById('tr-pedido').value,
        nome_cliente: document.getElementById('tr-cliente').value || 'Avulso',
        estado: document.getElementById('tr-estado').value || 'ND',
        modelo: document.getElementById('tr-modelo').value,
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

window.abrirModalTroca = abrirModalTroca;
window.fecharModalTroca = fecharModalTroca;
window.preencherDadosPedidoTroca = preencherDadosPedidoTroca;
window.salvarNovaTroca = salvarNovaTroca;
window.carregarTrocasDB = carregarTrocasDB;
window.toggleCamposExtravio = toggleCamposExtravio;