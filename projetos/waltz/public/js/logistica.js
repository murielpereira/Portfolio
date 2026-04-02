import { isGoogleChartsReady } from './utils.js';

export function mapEstadoParaISO(estado) {
    if (!estado) return null; const uf = estado.trim().toUpperCase();
    const map = { 'AC': 'BR-AC', 'AL': 'BR-AL', 'AP': 'BR-AP', 'AM': 'BR-AM', 'BA': 'BR-BA', 'CE': 'BR-CE', 'DF': 'BR-DF', 'DISTRITO FEDERAL': 'BR-DF', 'BRASÍLIA': 'BR-DF', 'ES': 'BR-ES', 'ESPÍRITO SANTO': 'BR-ES', 'GO': 'BR-GO', 'GOIÁS': 'BR-GO', 'MA': 'BR-MA', 'MARANHÃO': 'BR-MA', 'MT': 'BR-MT', 'MATO GROSSO': 'BR-MT', 'MS': 'BR-MS', 'MATO GROSSO DO SUL': 'BR-MS', 'MG': 'BR-MG', 'MINAS GERAIS': 'BR-MG', 'PA': 'BR-PA', 'PARÁ': 'BR-PA', 'PB': 'BR-PB', 'PARAÍBA': 'BR-PB', 'PR': 'BR-PR', 'PARANÁ': 'BR-PR', 'PE': 'BR-PE', 'PERNAMBUCO': 'BR-PE', 'PI': 'BR-PI', 'PIAUÍ': 'BR-PI', 'RJ': 'BR-RJ', 'RIO DE JANEIRO': 'BR-RJ', 'RN': 'BR-RN', 'RIO GRANDE DO NORTE': 'BR-RN', 'RS': 'BR-RS', 'RIO GRANDE DO SUL': 'BR-RS', 'RO': 'BR-RO', 'RONDÔNIA': 'BR-RO', 'RR': 'BR-RR', 'RORAIMA': 'BR-RR', 'SC': 'BR-SC', 'SANTA CATARINA': 'BR-SC', 'SP': 'BR-SP', 'SÃO PAULO': 'BR-SP', 'SE': 'BR-SE', 'SERGIPE': 'BR-SE', 'TO': 'BR-TO', 'TOCANTINS': 'BR-TO' };
    return map[uf] || null;
}

// O MOTOR DEFINITIVO: Mapeia qualquer CEP do Brasil para o Estado correto
export function obterEstadoPorCep(cep) {
    if (!cep) return '';
    const prefixo = parseInt(cep.replace(/\D/g, '').substring(0, 5));
    if (isNaN(prefixo)) return '';
    if (prefixo >= 1000 && prefixo <= 19999) return 'São Paulo';
    if (prefixo >= 20000 && prefixo <= 28999) return 'Rio de Janeiro';
    if (prefixo >= 29000 && prefixo <= 29999) return 'Espírito Santo';
    if (prefixo >= 30000 && prefixo <= 39999) return 'Minas Gerais';
    if (prefixo >= 40000 && prefixo <= 48999) return 'Bahia';
    if (prefixo >= 49000 && prefixo <= 49999) return 'Sergipe';
    if (prefixo >= 50000 && prefixo <= 56999) return 'Pernambuco';
    if (prefixo >= 57000 && prefixo <= 57999) return 'Alagoas';
    if (prefixo >= 58000 && prefixo <= 58999) return 'Paraíba';
    if (prefixo >= 59000 && prefixo <= 59999) return 'Rio Grande do Norte';
    if (prefixo >= 60000 && prefixo <= 63999) return 'Ceará';
    if (prefixo >= 64000 && prefixo <= 64999) return 'Piauí';
    if (prefixo >= 65000 && prefixo <= 65999) return 'Maranhão';
    if (prefixo >= 66000 && prefixo <= 68899) return 'Pará';
    if (prefixo >= 68900 && prefixo <= 68999) return 'Amapá';
    if (prefixo >= 69000 && prefixo <= 69299) return 'Amazonas';
    if (prefixo >= 69300 && prefixo <= 69399) return 'Roraima';
    if (prefixo >= 69400 && prefixo <= 69899) return 'Amazonas';
    if (prefixo >= 69900 && prefixo <= 69999) return 'Acre';
    if (prefixo >= 70000 && prefixo <= 72799) return 'Distrito Federal';
    if (prefixo >= 72800 && prefixo <= 72999) return 'Goiás';
    if (prefixo >= 73000 && prefixo <= 73399) return 'Distrito Federal';
    if (prefixo >= 73400 && prefixo <= 76799) return 'Goiás';
    if (prefixo >= 76800 && prefixo <= 76999) return 'Rondônia';
    if (prefixo >= 77000 && prefixo <= 77999) return 'Tocantins';
    if (prefixo >= 78000 && prefixo <= 78899) return 'Mato Grosso';
    if (prefixo >= 78900 && prefixo <= 78999) return 'Rondônia';
    if (prefixo >= 79000 && prefixo <= 79999) return 'Mato Grosso do Sul';
    if (prefixo >= 80000 && prefixo <= 87999) return 'Paraná';
    if (prefixo >= 88000 && prefixo <= 89999) return 'Santa Catarina';
    if (prefixo >= 90000 && prefixo <= 99999) return 'Rio Grande do Sul';
    return 'Desconhecido';
}

window.dadosLogisticaBackend = [];
let colunaOrdenacaoCep = -1;
let ordemCrescenteCep = true;

if (typeof google !== 'undefined' && google.charts) {
    google.charts.load('current', { 'packages': ['geochart'] });
}

export async function carregarDadosLogistica() {
    const tbody = document.getElementById('corpo-tabela-ceps');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Processando histórico do banco de dados...</td></tr>';
    
    try {
        const res = await fetch('/api/relatorios/logistica');
        const json = await res.json();
        if (json.sucesso && json.dados) {
            window.dadosLogisticaBackend = json.dados;
            renderizarTabelaCEPs();
        }
    } catch (e) { }
}

export function renderizarTabelaCEPs() {
    const tbody = document.getElementById('corpo-tabela-ceps'); 
    const divMapaCard = document.getElementById('mapa_brasil_card'); 
    const divMapaCanvas = document.getElementById('mapa_brasil_div');
    if (!tbody) return;
    
    const buscaRaw = (document.getElementById("busca-cep-analise")?.value || "").toLowerCase().trim();
    const buscaApenasNumeros = buscaRaw.replace(/\D/g, '');
    
    if (!window.dadosLogisticaBackend || window.dadosLogisticaBackend.length === 0) return;

    let resultadosTabela = [];
    let analiseAgrupadaMapaBR = {}; 

    // FIX 3: Enriquecer a base colocando o Estado Real em todos os itens
    const dadosEnriquecidos = window.dadosLogisticaBackend.map(d => {
        const cepLimpo = String(d.cep_prefixo || "");
        const estadoReal = obterEstadoPorCep(cepLimpo + '000'); 
        return { ...d, cepLimpo, estadoReal };
    });

    const isBuscandoTexto = buscaRaw.length > 0 && buscaApenasNumeros.length === 0;
    const isBuscandoNumero = buscaApenasNumeros.length > 0;

    if (isBuscandoNumero || isBuscandoTexto) {
        // MODO DETALHADO: Mostra os 5 dígitos
        let filtrados = [];
        if (isBuscandoNumero) {
            filtrados = dadosEnriquecidos.filter(d => d.cepLimpo.includes(buscaApenasNumeros));
            if (divMapaCard) divMapaCard.style.display = 'none'; 
        } else {
            filtrados = dadosEnriquecidos.filter(d => d.estadoReal.toLowerCase().includes(buscaRaw));
        }
        
        resultadosTabela = filtrados.map(item => ({
            estado: item.estadoReal,
            cep: item.cepLimpo + (item.cepLimpo.length === 5 ? '-***' : ''),
            mediaDias: item.media_dias,
            quantidade: item.volume
        }));
        
        if (isBuscandoTexto) {
             let agrupadoMapa = {};
             filtrados.forEach(item => {
                 const isoCode = mapEstadoParaISO(item.estadoReal);
                 if (isoCode) {
                     if (!agrupadoMapa[isoCode]) agrupadoMapa[isoCode] = { somaDiasVolume: 0, volumeTotal: 0 };
                     agrupadoMapa[isoCode].somaDiasVolume += (item.media_dias * item.volume);
                     agrupadoMapa[isoCode].volumeTotal += item.volume;
                 }
             });
             Object.keys(agrupadoMapa).forEach(iso => {
                 analiseAgrupadaMapaBR[iso] = { somaDias: agrupadoMapa[iso].somaDiasVolume, quantidade: agrupadoMapa[iso].volumeTotal };
             });
        }

    } else {
        // MODO GERAL: Agrupa tudo no Estado
        let agrupado = {};
        dadosEnriquecidos.forEach(item => {
            const est = item.estadoReal;
            if (!agrupado[est]) agrupado[est] = { somaDiasVolume: 0, volumeTotal: 0 };
            agrupado[est].somaDiasVolume += (item.media_dias * item.volume);
            agrupado[est].volumeTotal += item.volume;
        });

        resultadosTabela = Object.keys(agrupado).map(est => {
            const vol = agrupado[est].volumeTotal;
            const med = Math.round(agrupado[est].somaDiasVolume / vol);
            
            const isoCode = mapEstadoParaISO(est); 
            if (isoCode) {
                if (!analiseAgrupadaMapaBR[isoCode]) analiseAgrupadaMapaBR[isoCode] = { somaDias: 0, quantidade: 0 };
                analiseAgrupadaMapaBR[isoCode].somaDias += (med * vol);
                analiseAgrupadaMapaBR[isoCode].quantidade += vol;
            }
            return { estado: est, cep: `Geral (Todo o Estado)`, mediaDias: med, quantidade: vol };
        });
    }

    const desenharMapaInteligente = () => {
        if (divMapaCanvas && divMapaCard && window.google && google.visualization && google.visualization.GeoChart) {
            try {
                let dadosMapa = [ ["Region", "Média de Dias", "Quantidade"] ];
                Object.entries(analiseAgrupadaMapaBR).forEach(([iso, dados]) => dadosMapa.push([ iso, Math.round(dados.somaDias / dados.quantidade), dados.quantidade ]));
                const options = { region: 'BR', resolution: 'provinces', displayMode: 'regions', colorAxis: { colors: ['#a7f3d0', '#fef08a', '#fca5a5'] }, backgroundColor: 'transparent', datalessRegionColor: '#f1f5f9', legend: { textStyle: { color: '#475569', fontSize: 11 } } };
                new google.visualization.GeoChart(divMapaCanvas).draw(google.visualization.arrayToDataTable(dadosMapa), options);
                divMapaCard.style.display = 'block';
            } catch(mapErro) { divMapaCard.style.display = 'none'; }
        } else if (divMapaCard) setTimeout(desenharMapaInteligente, 300);
    };

    if (Object.keys(analiseAgrupadaMapaBR).length > 0) desenharMapaInteligente();
    else if (divMapaCard) divMapaCard.style.display = 'none';

    if (colunaOrdenacaoCep !== -1) {
        resultadosTabela.sort((a, b) => {
            let valA, valB;
            switch(colunaOrdenacaoCep) {
                case 0: valA = a.estado; valB = b.estado; break;
                case 1: valA = a.cep; valB = b.cep; break;
                case 2: valA = a.mediaDias; valB = b.mediaDias; break;
                case 3: valA = a.quantidade; valB = b.quantidade; break;
            }
            if (valA < valB) return ordemCrescenteCep ? -1 : 1;
            if (valA > valB) return ordemCrescenteCep ? 1 : -1;
            return 0;
        });
    } else {
        resultadosTabela.sort((a, b) => b.quantidade - a.quantidade);
    }
    
    tbody.innerHTML = '';
    resultadosTabela.forEach(r => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td style="font-weight:500;">${r.estado}</td> 
            <td style="font-family: monospace; font-size: 14px; color: #64748b;">${r.cep}</td>
            <td style="font-weight: bold; color: #2563eb; font-size: 15px;">${r.mediaDias} dias</td>
            <td style="color: #475569;">${r.quantidade} entregas mapeadas</td>
        `;
        tbody.appendChild(linha);
    });
}

export function ordenarTabelaCep(colIndex) {
    if (colunaOrdenacaoCep === colIndex) ordemCrescenteCep = !ordemCrescenteCep; 
    else { colunaOrdenacaoCep = colIndex; ordemCrescenteCep = true; }
    for(let i = 0; i <= 3; i++) { 
        const icon = document.getElementById(`sort-cep-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-cep-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescenteCep ? '↑' : '↓'; activeIcon.classList.add('active'); }
    renderizarTabelaCEPs();
}

window.ordenarTabelaCep = ordenarTabelaCep;
window.renderizarTabelaCEPs = renderizarTabelaCEPs;
window.carregarDadosLogistica = carregarDadosLogistica;