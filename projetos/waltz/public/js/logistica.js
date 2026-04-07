// FIX: Garantia absoluta de carregamento do Google Charts
function garantirGoogleCharts(callback) {
    if (typeof google !== 'undefined' && google.visualization && google.visualization.GeoChart) {
        callback();
    } else if (!document.getElementById('google-charts-script')) {
        const script = document.createElement('script');
        script.id = 'google-charts-script';
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.onload = () => {
            google.charts.load('current', { 'packages': ['geochart'], 'language': 'pt-br' });
            google.charts.setOnLoadCallback(callback);
        };
        document.head.appendChild(script);
    } else {
        setTimeout(() => garantirGoogleCharts(callback), 300);
    }
}

export function mapEstadoParaISO(estado) {
    if (!estado) return null; 
    const uf = estado.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const map = { 'AC': 'BR-AC', 'ACRE': 'BR-AC', 'AL': 'BR-AL', 'ALAGOAS': 'BR-AL', 'AP': 'BR-AP', 'AMAPA': 'BR-AP', 'AM': 'BR-AM', 'AMAZONAS': 'BR-AM', 'BA': 'BR-BA', 'BAHIA': 'BR-BA', 'CE': 'BR-CE', 'CEARA': 'BR-CE', 'DF': 'BR-DF', 'DISTRITO FEDERAL': 'BR-DF', 'BRASILIA': 'BR-DF', 'ES': 'BR-ES', 'ESPIRITO SANTO': 'BR-ES', 'GO': 'BR-GO', 'GOIAS': 'BR-GO', 'MA': 'BR-MA', 'MARANHAO': 'BR-MA', 'MT': 'BR-MT', 'MATO GROSSO': 'BR-MT', 'MS': 'BR-MS', 'MATO GROSSO DO SUL': 'BR-MS', 'MG': 'BR-MG', 'MINAS GERAIS': 'BR-MG', 'PA': 'BR-PA', 'PARA': 'BR-PA', 'PB': 'BR-PB', 'PARAIBA': 'BR-PB', 'PR': 'BR-PR', 'PARANA': 'BR-PR', 'PE': 'BR-PE', 'PERNAMBUCO': 'BR-PE', 'PI': 'BR-PI', 'PIAUI': 'BR-PI', 'RJ': 'BR-RJ', 'RIO DE JANEIRO': 'BR-RJ', 'RN': 'BR-RN', 'RIO GRANDE DO NORTE': 'BR-RN', 'RS': 'BR-RS', 'RIO GRANDE DO SUL': 'BR-RS', 'RO': 'BR-RO', 'RONDONIA': 'BR-RO', 'RR': 'BR-RR', 'RORAIMA': 'BR-RR', 'SC': 'BR-SC', 'SANTA CATARINA': 'BR-SC', 'SP': 'BR-SP', 'SAO PAULO': 'BR-SP', 'SE': 'BR-SE', 'SERGIPE': 'BR-SE', 'TO': 'BR-TO', 'TOCANTINS': 'BR-TO' };
    return map[uf] || null;
}

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

const mapaEstados = {
    "01": "São Paulo (Capital)", "02": "São Paulo (Capital)", "03": "São Paulo (Capital)", "04": "São Paulo (Capital)", "05": "São Paulo (Capital)",
    "06": "São Paulo (RMS)", "07": "São Paulo (RMS)", "08": "São Paulo (RMS)", "09": "São Paulo (RMS)", "11": "São Paulo (Litoral)",
    "12": "São Paulo (Interior)", "13": "São Paulo (Interior)", "14": "São Paulo (Interior)", "15": "São Paulo (Interior)", "16": "São Paulo (Interior)",
    "20": "Rio de Janeiro", "21": "Rio de Janeiro", "22": "Rio de Janeiro", "23": "Rio de Janeiro", "29": "Espírito Santo",
    "30": "Minas Gerais", "31": "Minas Gerais", "40": "Bahia", "49": "Sergipe", "50": "Pernambuco", "57": "Alagoas",
    "58": "Alagoas/Paraíba", "59": "Rio Grande do Norte", "60": "Ceará", "64": "Piauí", "65": "Maranhão", "66": "Maranhão/Pará",
    "68": "Pará/Amapá", "69": "Amapá/Amazonas/Roraima", "70": "Distrito Federal", "71": "Distrito Federal", "72": "Distrito Federal",
    "74": "Goiás", "76": "Goiás/Tocantins", "77": "Tocantins", "78": "Mato Grosso", "79": "Mato Grosso do Sul",
    "80": "Paraná", "81": "Paraná", "88": "Santa Catarina", "89": "Santa Catarina", "90": "Rio Grande do Sul", "99": "Rio Grande do Sul"
};

window.dadosLogisticaBackend = [];
let colunaOrdenacaoCep = -1;
let ordemCrescenteCep = true;

export async function carregarDadosLogistica() {
    const tbody = document.getElementById('corpo-tabela-ceps');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Processando histórico do banco de dados...</td></tr>';
    
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
    
    const inputBusca = document.getElementById("busca-cep-analise");
    const buscaRaw = (inputBusca?.value || "").toLowerCase().trim();
    const buscaApenasNumeros = buscaRaw.replace(/\D/g, '');
    
    if (!window.dadosLogisticaBackend || window.dadosLogisticaBackend.length === 0) return;

    let resultadosTabela = [];
    let analiseAgrupadaMapaBR = {}; 

    // FIX: Agora lemos também o volume de fretes que foram realmente pagos (maior que 0)
    const dadosEnriquecidos = window.dadosLogisticaBackend.map(d => {
        const cepLimpo = String(d.cep_prefixo || d.prefixo_cep || "");
        const estadoReal = obterEstadoPorCep(cepLimpo + '000'); 
        return { 
            ...d, 
            cepLimpo, 
            estadoReal, 
            media_frete: parseFloat(d.media_frete || 0),
            volume_frete_pago: parseInt(d.volume_frete_pago || 0)
        };
    });

    const isBuscandoTexto = buscaRaw.length > 0 && buscaApenasNumeros.length === 0;
    const isBuscandoNumero = buscaApenasNumeros.length > 0;

    if (isBuscandoNumero || isBuscandoTexto) {
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
            mediaFrete: item.media_frete,
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
        let agrupado = {};
        dadosEnriquecidos.forEach(item => {
            const est = item.estadoReal;
            if (!agrupado[est]) agrupado[est] = { somaDiasVolume: 0, somaFreteVolume: 0, volumeTotal: 0, volumeFretePago: 0 };
            
            agrupado[est].somaDiasVolume += (item.media_dias * item.volume);
            agrupado[est].volumeTotal += item.volume;
            
            // FIX: Soma do frete baseada apenas nos pedidos que não foram Frete Grátis
            agrupado[est].somaFreteVolume += (item.media_frete * item.volume_frete_pago);
            agrupado[est].volumeFretePago += item.volume_frete_pago;
        });

        resultadosTabela = Object.keys(agrupado).map(est => {
            const vol = agrupado[est].volumeTotal;
            const med = Math.round(agrupado[est].somaDiasVolume / vol);
            
            const volFrete = agrupado[est].volumeFretePago;
            const medFrete = volFrete > 0 ? (agrupado[est].somaFreteVolume / volFrete) : 0;
            
            const isoCode = mapEstadoParaISO(est); 
            if (isoCode) {
                if (!analiseAgrupadaMapaBR[isoCode]) analiseAgrupadaMapaBR[isoCode] = { somaDias: 0, quantidade: 0 };
                analiseAgrupadaMapaBR[isoCode].somaDias += (med * vol);
                analiseAgrupadaMapaBR[isoCode].quantidade += vol;
            }
            return { estado: est, cep: `Geral (Todo o Estado)`, mediaDias: med, mediaFrete: medFrete, quantidade: vol };
        });
    }

    if (Object.keys(analiseAgrupadaMapaBR).length > 0) {
        garantirGoogleCharts(() => {
            if(divMapaCanvas && divMapaCard) {
                try {
                    let dadosMapa = [ ["Region", "Média de Dias", "Quantidade"] ];
                    Object.entries(analiseAgrupadaMapaBR).forEach(([iso, dados]) => dadosMapa.push([ iso, Math.round(dados.somaDias / dados.quantidade), dados.quantidade ]));
                    const options = { region: 'BR', resolution: 'provinces', displayMode: 'regions', colorAxis: { colors: ['#a7f3d0', '#fef08a', '#fca5a5'] }, backgroundColor: 'transparent', datalessRegionColor: '#f1f5f9', legend: { textStyle: { color: '#475569', fontSize: 11 } } };
                    new google.visualization.GeoChart(divMapaCanvas).draw(google.visualization.arrayToDataTable(dadosMapa), options);
                    divMapaCard.style.display = 'block';
                } catch(mapErro) { divMapaCard.style.display = 'none'; }
            }
        });
    } else if (divMapaCard) divMapaCard.style.display = 'none';

    if (colunaOrdenacaoCep !== -1) {
        resultadosTabela.sort((a, b) => {
            let valA, valB;
            switch(colunaOrdenacaoCep) {
                case 0: valA = a.estado; valB = b.estado; break;
                case 1: valA = a.cep; valB = b.cep; break;
                case 2: valA = a.mediaDias; valB = b.mediaDias; break;
                case 3: valA = a.mediaFrete; valB = b.mediaFrete; break;
                case 4: valA = a.quantidade; valB = b.quantidade; break;
            }
            if (valA < valB) return ordemCrescenteCep ? -1 : 1;
            if (valA > valB) return ordemCrescenteCep ? 1 : -1;
            return 0;
        });
    } else {
        resultadosTabela.sort((a, b) => a.estado.localeCompare(b.estado));
    }
    
    tbody.innerHTML = '';
    resultadosTabela.forEach(r => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td style="font-weight:500;">${r.estado}</td> 
            <td style="font-family: monospace; font-size: 14px; color: #64748b;">${r.cep}</td>
            <td style="font-weight: bold; color: #2563eb; font-size: 15px;">${r.mediaDias} dias</td>
            <td style="font-weight: bold; color: #ef4444; font-size: 14px;">R$ ${parseFloat(r.mediaFrete || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            <td style="color: #475569;">${r.quantidade} entregas mapeadas</td>
        `;
        tbody.appendChild(linha);
    });
}

export function ordenarTabelaCep(colIndex) {
    if (colunaOrdenacaoCep === colIndex) ordemCrescenteCep = !ordemCrescenteCep; 
    else { colunaOrdenacaoCep = colIndex; ordemCrescenteCep = true; }
    for(let i = 0; i <= 4; i++) { 
        const icon = document.getElementById(`sort-cep-${i}`); 
        if(icon) { icon.innerText = '↑↓'; icon.classList.remove('active'); } 
    }
    const activeIcon = document.getElementById(`sort-cep-${colIndex}`);
    if(activeIcon) { activeIcon.innerText = ordemCrescenteCep ? '↑' : '↓'; activeIcon.classList.add('active'); }
    renderizarTabelaCEPs();
}

document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'busca-cep-analise') {
        if(window.renderizarTabelaCEPs) window.renderizarTabelaCEPs();
    }
});

window.ordenarTabelaCep = ordenarTabelaCep;
window.renderizarTabelaCEPs = renderizarTabelaCEPs;
window.carregarDadosLogistica = carregarDadosLogistica;