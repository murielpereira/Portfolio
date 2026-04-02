export async function carregarDadosEntregas() {
    const tbody = document.getElementById('corpo-tabela-entregas');
    if (!tbody) return;
    try {
        const res = await fetch('/api/relatorios/entregas');
        const json = await res.json();
        if (json.sucesso) {
            renderizarGraficosEntregas(json.geral);
            renderizarTabelaEntregas(json.estados);
        }
    } catch(e) {}
}

function renderizarGraficosEntregas(dadosGerais) {
    const divGrafico = document.getElementById('grafico-transportadoras-div');
    if (divGrafico && typeof google !== 'undefined' && google.visualization) {
        const dados = [['Transportadora', 'Envios']];
        dadosGerais.forEach(d => dados.push([d.transportadora, d.envios]));
        const dataTable = google.visualization.arrayToDataTable(dados);
        const options = { title: 'Distribuição de Envios', pieHole: 0.4, backgroundColor: 'transparent', chartArea: { width: '90%', height: '80%' }, legend: { position: 'right' } };
        new google.visualization.PieChart(divGrafico).draw(dataTable, options);
    }

    const tbodyGeral = document.getElementById('corpo-tabela-transportadoras');
    if (tbodyGeral) {
        tbodyGeral.innerHTML = '';
        dadosGerais.forEach(d => {
            tbodyGeral.innerHTML += `<tr>
                <td style="font-weight:600;">${d.transportadora}</td>
                <td>${d.envios} envios</td>
                <td style="color:#ef4444; font-weight:bold;">R$ ${parseFloat(d.media_frete || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td style="color:#10b981; font-weight:bold;">${d.media_dias ? d.media_dias + ' dias' : '-'}</td>
            </tr>`;
        });
    }
}

function renderizarTabelaEntregas(dadosEstados) {
    const tbody = document.getElementById('corpo-tabela-entregas');
    tbody.innerHTML = '';
    dadosEstados.forEach(d => {
        tbody.innerHTML += `<tr>
            <td style="font-weight:600;">${d.estado}</td>
            <td><span class="badge badge-prata">${d.transportadora}</span></td>
            <td>${d.envios} envios</td>
            <td style="color:#3b82f6; font-weight:bold;">${d.media_dias} dias</td>
        </tr>`;
    });
}
window.carregarDadosEntregas = carregarDadosEntregas;