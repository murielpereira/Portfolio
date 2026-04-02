import { isGoogleChartsReady } from './utils.js';

export function mapEstadoParaISO(estado) {
    if (!estado) return null; const uf = estado.trim().toUpperCase();
    const map = { 'AC': 'BR-AC', 'ACRE': 'BR-AC', 'AL': 'BR-AL', 'ALAGOAS': 'BR-AL', 'AP': 'BR-AP', 'AMAPÁ': 'BR-AP', 'AMAPA': 'BR-AP', 'AM': 'BR-AM', 'AMAZONAS': 'BR-AM', 'BA': 'BR-BA', 'BAHIA': 'BR-BA', 'CE': 'BR-CE', 'CEARÁ': 'BR-CE', 'CEARA': 'BR-CE', 'DF': 'BR-DF', 'DISTRITO FEDERAL': 'BR-DF', 'BRASÍLIA': 'BR-DF', 'ES': 'BR-ES', 'ESPÍRITO SANTO': 'BR-ES', 'ESPIRITO SANTO': 'BR-ES', 'GO': 'BR-GO', 'GOIÁS': 'BR-GO', 'GOIAS': 'BR-GO', 'MA': 'BR-MA', 'MARANHÃO': 'BR-MA', 'MARANHAO': 'BR-MA', 'MT': 'BR-MT', 'MATO GROSSO': 'BR-MT', 'MS': 'BR-MS', 'MATO GROSSO DO SUL': 'BR-MS', 'MG': 'BR-MG', 'MINAS GERAIS': 'BR-MG', 'PA': 'BR-PA', 'PARÁ': 'BR-PA', 'PARA': 'BR-PA', 'PB': 'BR-PB', 'PARAÍBA': 'BR-PB', 'PARAIBA': 'BR-PB', 'PR': 'BR-PR', 'PARANÁ': 'BR-PR', 'PARANA': 'BR-PR', 'PE': 'BR-PE', 'PERNAMBUCO': 'BR-PE', 'PI': 'BR-PI', 'PIAUÍ': 'BR-PI', 'PIAUI': 'BR-PI', 'RJ': 'BR-RJ', 'RIO DE JANEIRO': 'BR-RJ', 'RN': 'BR-RN', 'RIO GRANDE DO NORTE': 'BR-RN', 'RS': 'BR-RS', 'RIO GRANDE DO SUL': 'BR-RS', 'RO': 'BR-RO', 'RONDÔNIA': 'BR-RO', 'RONDONIA': 'BR-RO', 'RR': 'BR-RR', 'RORAIMA': 'BR-RR', 'SC': 'BR-SC', 'SANTA CATARINA': 'BR-SC', 'SP': 'BR-SP', 'SÃO PAULO': 'BR-SP', 'SAO PAULO': 'BR-SP', 'SE': 'BR-SE', 'SERGIPE': 'BR-SE', 'TO': 'BR-TO', 'TOCANTINS': 'BR-TO' };
    return map[uf] || null;
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

// Garante o carregamento do Google GeoChart
if (typeof google !== 'undefined' && google.charts) {
    google.charts.load('current', { 'packages': ['geochart'] });
}

export async function carregarDadosLogistica() {
    const tbody = document.getElementById('corpo-tabela-ceps');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Processando todo o histórico do banco de dados...</td></tr>';
    
    try {
        const res = await fetch('/api/relatorios/logistica');
        const json = await res.json();
        
        if (json.sucesso && json.dados) {
            window.dadosLogisticaBackend = json.dados;
            renderizarTabelaCEPs();
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Nenhuma entrega mapeada ainda.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar histórico.</td></tr>';
    }
}

export function renderizarTabelaCEPs() {
    const tbody = document.getElementById('corpo-tabela-ceps'); 
    const divMapaCard = document.getElementById('mapa_brasil_card'); 
    const divMapaCanvas = document.getElementById('mapa_brasil_div');
    if (!tbody) return;
    
    const buscaRaw = (document.getElementById("busca-cep-analise")?.value || "").toLowerCase().trim();
    const buscaApenasNumeros = buscaRaw.replace(/\D/g, '');
    
    if (!window.dadosLogisticaBackend || window.dadosLogisticaBackend.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Sem dados disponíveis para cálculo.</td></tr>`;
        if(divMapaCard) divMapaCard.style.display = 'none';
        return;
    }

    let resultadosTabela = [];
    let analiseAgrupadaMapaBR = {}; 

    // MODO ESPECÍFICO: Usuário digitou um número de CEP
    if (buscaApenasNumeros.length > 0) {
        const filtrados = window.dadosLogisticaBackend.filter(d => {
            const prefixoStr = String(d.cep_prefixo || "");
            return prefixoStr.includes(buscaApenasNumeros);
        });
        
        resultadosTabela = filtrados.map(item => {
            const prefixo2 = String(item.cep_prefixo).substring(0, 2);
            return {
                estado: mapaEstados[prefixo2] || 'Região Desconhecida',
                cep: item.cep_prefixo + (String(item.cep_prefixo).length === 5 ? '-***' : ''),
                mediaDias: item.media_dias,
                quantidade: item.volume
            };
        });
        
        // Esconde o mapa propositadamente no modo CEP Específico
        if (divMapaCard) divMapaCard.style.display = 'none'; 
        
    } else {
        // MODO GERAL: Agrupa tudo por Estado (Média Macro)
        let agrupado = {};
        window.dadosLogisticaBackend.forEach(item => {
            if (!item.cep_prefixo) return;
            const prefixo2 = String(item.cep_prefixo).substring(0, 2);
            if (!agrupado[prefixo2]) agrupado[prefixo2] = { somaDiasVolume: 0, volumeTotal: 0 };
            
            agrupado[prefixo2].somaDiasVolume += (item.media_dias * item.volume);
            agrupado[prefixo2].volumeTotal += item.volume;
        });

        resultadosTabela = Object.keys(agrupado).map(pref => {
            const vol = agrupado[pref].volumeTotal;
            const med = Math.round(agrupado[pref].somaDiasVolume / vol);
            const nomeEstado = mapaEstados[pref] || `Região ${pref}`;
            
            // Prepara os dados para desenhar o Mapa
            const isoCode = mapEstadoParaISO(nomeEstado.split(' (')[0]); 
            if (isoCode) {
                if (!analiseAgrupadaMapaBR[isoCode]) analiseAgrupadaMapaBR[isoCode] = { somaDias: 0, quantidade: 0 };
                analiseAgrupadaMapaBR[isoCode].somaDias += (med * vol);
                analiseAgrupadaMapaBR[isoCode].quantidade += vol;
            }

            return { estado: nomeEstado, cep: `Geral (Faixa ${pref})`, mediaDias: med, quantidade: vol };
        });

        // Se o usuário digitou letras (ex: "Bahia"), filtramos a tabela sem apagar o mapa
        if (buscaRaw.length > 0) {
            resultadosTabela = resultadosTabela.filter(r => r.estado.toLowerCase().includes(buscaRaw));
        }

        // Função resiliente para desenhar o Mapa
        const desenharMapaInteligente = () => {
            if (divMapaCanvas && divMapaCard && window.google && google.visualization && google.visualization.GeoChart) {
                try {
                    let dadosMapa = [ ["Region", "Média de Dias", "Quantidade"] ];
                    Object.entries(analiseAgrupadaMapaBR).forEach(([iso, dados]) => {
                        dadosMapa.push([ iso, Math.round(dados.somaDias / dados.quantidade), dados.quantidade ]);
                    });
                    const options = { region: 'BR', resolution: 'provinces', displayMode: 'regions', colorAxis: { colors: ['#a7f3d0', '#fef08a', '#fca5a5'] }, backgroundColor: 'transparent', datalessRegionColor: '#f1f5f9', legend: { textStyle: { color: '#475569', fontSize: 11 } } };
                    new google.visualization.GeoChart(divMapaCanvas).draw(google.visualization.arrayToDataTable(dadosMapa), options);
                    divMapaCard.style.display = 'block';
                } catch(mapErro) { 
                    divMapaCard.style.display = 'none'; 
                }
            } else if (divMapaCard) {
                // Tenta novamente em 300ms caso o Google ainda esteja a carregar
                setTimeout(desenharMapaInteligente, 300);
            }
        };

        if (Object.keys(analiseAgrupadaMapaBR).length > 0) {
            desenharMapaInteligente();
        } else if (divMapaCard) {
            divMapaCard.style.display = 'none';
        }
    }

    // ORDENAÇÃO DA TABELA
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
        resultadosTabela.sort((a, b) => b.quantidade - a.quantidade); // Default decrescente por volume
    }
    
    tbody.innerHTML = '';
    if (resultadosTabela.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum histórico encontrado com esse critério.</td></tr>`; 
        return;
    }
    
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
    if (colunaOrdenacaoCep === colIndex) {
        ordemCrescenteCep = !ordemCrescenteCep; 
    } else { 
        colunaOrdenacaoCep = colIndex; 
        ordemCrescenteCep = true; 
    }
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