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
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Erro ao carregar trocas.</td></tr>';
    }
}

function renderizarTrocas() {
    const tbody = document.getElementById('corpo-tabela-trocas');
    tbody.innerHTML = '';

    if (window.listaTrocas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Nenhuma troca registrada.</td></tr>';
        return;
    }

    window.listaTrocas.forEach(t => {
        const dataFormatada = new Date(t.data_registro).toLocaleDateString('pt-BR');
        let corPagador = t.frete_pago_por === 'Âme' ? 'badge-semcompra' : (t.frete_pago_por === 'Cliente' ? 'badge-entregue' : 'badge-ouro');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:var(--text-muted);">${dataFormatada}</td>
            <td style="font-weight:600; color:var(--primary);">#${t.numero_pedido}</td>
            <td style="font-weight:500;">${t.nome_cliente}</td>
            <td>${t.modelo} <span style="color:var(--text-muted); font-size:11px;">(${t.qtd_pecas}x)</span></td>
            <td>${t.motivo}</td>
            <td style="font-weight:bold;">R$ ${parseFloat(t.valor_frete || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            <td><span class="badge ${corPagador}">${t.frete_pago_por}</span></td>
            <td>${t.canal}</td>
        `;
        tbody.appendChild(tr);
    });
}

function calcularKPIsTrocas() {
    if (window.listaTrocas.length === 0) return;

    // 1. Total Trocas
    document.getElementById('kpi-trocas-qtd').innerText = window.listaTrocas.length;

    // 2. Prejuízo Frete (Âme)
    const custoAme = window.listaTrocas.filter(t => t.frete_pago_por === 'Âme').reduce((acc, t) => acc + parseFloat(t.valor_frete || 0), 0);
    document.getElementById('kpi-trocas-custo').innerText = `R$ ${custoAme.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;

    // 3 e 4. Produto e Estado mais problemáticos
    let contagemProdutos = {};
    let contagemEstados = {};

    window.listaTrocas.forEach(t => {
        if (t.modelo) contagemProdutos[t.modelo] = (contagemProdutos[t.modelo] || 0) + 1;
        if (t.estado) contagemEstados[t.estado] = (contagemEstados[t.estado] || 0) + 1;
    });

    const produtoProblema = Object.keys(contagemProdutos).length > 0 ? Object.keys(contagemProdutos).reduce((a, b) => contagemProdutos[a] > contagemProdutos[b] ? a : b) : '-';
    const estadoProblema = Object.keys(contagemEstados).length > 0 ? Object.keys(contagemEstados).reduce((a, b) => contagemEstados[a] > contagemEstados[b] ? a : b) : '-';

    document.getElementById('kpi-trocas-produto').innerText = produtoProblema;
    document.getElementById('kpi-trocas-estado').innerText = estadoProblema;
}

// ==========================================
// FUNÇÕES DO MODAL E INTEGRAÇÃO NUVEMSHOP
// ==========================================
export function abrirModalTroca() {
    document.getElementById('form-nova-troca').reset();
    document.getElementById('tr-aviso-pedido').style.display = 'none';
    document.getElementById('modal-troca').classList.add('active');
}

export function fecharModalTroca() {
    document.getElementById('modal-troca').classList.remove('active');
}

// Mágica: Busca os dados automaticamente
export async function preencherDadosPedidoTroca() {
    const numPedido = document.getElementById('tr-pedido').value;
    const aviso = document.getElementById('tr-aviso-pedido');
    if (!numPedido) return;

    // Primeiro, verifica se os pedidos já estão na memória do Frontend!
    if (!window.todosOsPedidosNuvem || window.todosOsPedidosNuvem.length === 0) {
        if (window.carregarPedidosNuvemDB) await window.carregarPedidosNuvemDB();
    }

    const pedidoEncontrado = window.todosOsPedidosNuvem.find(p => p.numero_pedido == numPedido);

    if (pedidoEncontrado) {
        document.getElementById('tr-cliente').value = pedidoEncontrado.nome_cliente || 'Desconhecido';
        document.getElementById('tr-estado').value = pedidoEncontrado.estado || 'ND';
        aviso.style.display = 'none';
    } else {
        document.getElementById('tr-cliente').value = '';
        document.getElementById('tr-estado').value = '';
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
        motivo: document.getElementById('tr-motivo').value
    };

    try {
        const res = await fetch('/api/trocas', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (res.ok) {
            fecharModalTroca();
            carregarTrocasDB(); // Recarrega a tabela e KPIs
        } else {
            alert('Erro ao salvar no banco de dados.');
        }
    } catch (e) {
        alert('Erro de conexão.');
    }
}

window.abrirModalTroca = abrirModalTroca;
window.fecharModalTroca = fecharModalTroca;
window.preencherDadosPedidoTroca = preencherDadosPedidoTroca;
window.salvarNovaTroca = salvarNovaTroca;
window.carregarTrocasDB = carregarTrocasDB;