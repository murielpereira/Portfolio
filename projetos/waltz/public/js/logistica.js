import { isGoogleChartsReady } from './utils.js';

export function mapEstadoParaISO(estado) {
    if (!estado) return null; const uf = estado.trim().toUpperCase();
    const map = { 'AC': 'BR-AC', 'ACRE': 'BR-AC', 'AL': 'BR-AL', 'ALAGOAS': 'BR-AL', 'AP': 'BR-AP', 'AMAPÁ': 'BR-AP', 'AMAPA': 'BR-AP', 'AM': 'BR-AM', 'AMAZONAS': 'BR-AM', 'BA': 'BR-BA', 'BAHIA': 'BR-BA', 'CE': 'BR-CE', 'CEARÁ': 'BR-CE', 'CEARA': 'BR-CE', 'DF': 'BR-DF', 'DISTRITO FEDERAL': 'BR-DF', 'BRASÍLIA': 'BR-DF', 'ES': 'BR-ES', 'ESPÍRITO SANTO': 'BR-ES', 'ESPIRITO SANTO': 'BR-ES', 'GO': 'BR-GO', 'GOIÁS': 'BR-GO', 'GOIAS': 'BR-GO', 'MA': 'BR-MA', 'MARANHÃO': 'BR-MA', 'MARANHAO': 'BR-MA', 'MT': 'BR-MT', 'MATO GROSSO': 'BR-MT', 'MS': 'BR-MS', 'MATO GROSSO DO SUL': 'BR-MS', 'MG': 'BR-MG', 'MINAS GERAIS': 'BR-MG', 'PA': 'BR-PA', 'PARÁ': 'BR-PA', 'PARA': 'BR-PA', 'PB': 'BR-PB', 'PARAÍBA': 'BR-PB', 'PARAIBA': 'BR-PB', 'PR': 'BR-PR', 'PARANÁ': 'BR-PR', 'PARANA': 'BR-PR', 'PE': 'BR-PE', 'PERNAMBUCO': 'BR-PE', 'PI': 'BR-PI', 'PIAUÍ': 'BR-PI', 'PIAUI': 'BR-PI', 'RJ': 'BR-RJ', 'RIO DE JANEIRO': 'BR-RJ', 'RN': 'BR-RN', 'RIO GRANDE DO NORTE': 'BR-RN', 'RS': 'BR-RS', 'RIO GRANDE DO SUL': 'BR-RS', 'RO': 'BR-RO', 'RONDÔNIA': 'BR-RO', 'RONDONIA': 'BR-RO', 'RR': 'BR-RR', 'RORAIMA': 'BR-RR', 'SC': 'BR-SC', 'SANTA CATARINA': 'BR-SC', 'SP': 'BR-SP', 'SÃO PAULO': 'BR-SP', 'SAO PAULO': 'BR-SP', 'SE': 'BR-SE', 'SERGIPE': 'BR-SE', 'TO': 'BR-TO', 'TOCANTINS': 'BR-TO' };
    return map[uf] || null;
}

export function normalizarNomeEstado(estadoRaw) {
    if (!estadoRaw || estadoRaw.trim() === '') return 'Internacional/Outros'; const input = estadoRaw.trim().toUpperCase();
    const mapNormalizacao = { 'ACRE': 'Acre', 'AC': 'Acre', 'ALAGOAS': 'Alagoas', 'AL': 'Alagoas', 'AMAPÁ': 'Amapá', 'AMAPA': 'Amapá', 'AP': 'Amapá', 'AMAZONAS': 'Amazonas', 'AM': 'Amazonas', 'BAHIA': 'Bahia', 'BA': 'Bahia', 'CEARÁ': 'Ceará', 'CEARA': 'Ceará', 'CE': 'Ceará', 'DISTRITO FEDERAL': 'Distrito Federal', 'BRASÍLIA': 'Distrito Federal', 'BRASILIA': 'Distrito Federal', 'DF': 'Distrito Federal', 'ESPÍRITO SANTO': 'Espírito Santo', 'ESPIRITO SANTO': 'Espírito Santo', 'ES': 'Espírito Santo', 'GOIÁS': 'Goiás', 'GOIAS': 'Goiás', 'GO': 'Goiás', 'MARANHÃO': 'Maranhão', 'MARANHAO': 'Maranhão', 'MA': 'Maranhão', 'MATO GROSSO': 'Mato Grosso', 'MT': 'Mato Grosso', 'MATO GROSSO DO SUL': 'Mato Grosso do Sul', 'MS': 'Mato Grosso do Sul', 'MINAS GERAIS': 'Minas Gerais', 'MG': 'Minas Gerais', 'PARÁ': 'Pará', 'PARA': 'Pará', 'PA': 'Pará', 'PARAÍBA': 'Paraíba', 'PARAIBA': 'Paraíba', 'PB': 'Paraíba', 'PARANÁ': 'Paraná', 'PARANA': 'Paraná', 'PR': 'Paraná', 'PERNAMBUCO': 'Pernambuco', 'PE': 'Pernambuco', 'PIAUÍ': 'Piauí', 'PIAUI': 'Piauí', 'PI': 'Piauí', 'RIO DE JANEIRO': 'Rio de Janeiro', 'RJ': 'Rio de Janeiro', 'RIO GRANDE DO NORTE': 'Rio Grande do Norte', 'RN': 'Rio Grande do Norte', 'RIO GRANDE DO SUL': 'Rio Grande do Sul', 'RS': 'Rio Grande do Sul', 'RONDÔNIA': 'Rondônia', 'RONDONIA': 'Rondônia', 'RO': 'Rondônia', 'RORAIMA': 'Roraima', 'RR': 'Roraima', 'SANTA CATARINA': 'Santa Catarina', 'SC': 'Santa Catarina', 'SÃO PAULO': 'São Paulo', 'SAO PAULO': 'São Paulo', 'SP': 'São Paulo', 'SERGIPE': 'Sergipe', 'SE': 'Sergipe', 'TO': 'TOCANTINS', 'TOCANTINS': 'Tocantins' };
    return mapNormalizacao[input] || estadoRaw; 
}

let colunaOrdenacaoCep = -1;
let ordemCrescenteCep = true;

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

export function renderizarTabelaCEPs() {
    const tbody = document.getElementById('corpo-tabela-ceps'); 
    const divMapaCard = document.getElementById('mapa_brasil_card'); 
    const divMapaCanvas = document.getElementById('mapa_brasil_div');
    if (!tbody || !divMapaCanvas) return;
    
    const filtroCepLimpo = (document.getElementById("busca-cep-analise")?.value || "").replace(/\D/g, '');
    let analiseAgrupadaTabela = {}; 
    let analiseAgrupadaMapaBR = {};
    
    if (!window.todosOsPedidosNuvem) return;

    window.todosOsPedidosNuvem.forEach(p => {
        if (!p.data_envio || !p.data_entrega) return;
        
        // FIX: Lemos vários tipos de status fechados/entregues em português e inglês
        const status = (p.status_nuvemshop || '').toUpperCase();
        if (status !== 'ENTREGUE' && status !== 'ARQUIVADO' && status !== 'CLOSED' && status !== 'DELIVERED') return;
        
        const cepLimpo = (p.cep || '').replace(/\D/g, '');
        const ufStandard = normalizarNomeEstado(p.estado || 'Não Informado');
        
        // FIX: Se o usuário filtrou, mas o CEP não contém os números, salta este pedido!
        if (filtroCepLimpo && !cepLimpo.includes(filtroCepLimpo)) return;
        
        const dataEnvio = new Date(p.data_envio);
        const dataEntrega = new Date(p.data_entrega);
        const diffTime = dataEntrega.getTime() - dataEnvio.getTime();
        
        if (diffTime < 0) return;
        const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDias > 60) return;
        
        let chaveGrupoTabela = filtroCepLimpo === "" ? ufStandard : `${ufStandard}|${cepLimpo.length >= 5 ? cepLimpo.substring(0, 5) + '-***' : (cepLimpo || 'Sem CEP')}`;
        let textoCepExibicao = filtroCepLimpo === "" ? 'Geral (Todo o Estado)' : (cepLimpo.length >= 5 ? cepLimpo.substring(0, 5) + '-***' : (cepLimpo || 'Sem CEP'));
        
        if (!analiseAgrupadaTabela[chaveGrupoTabela]) analiseAgrupadaTabela[chaveGrupoTabela] = { estado: ufStandard, cep: textoCepExibicao, somaDias: 0, quantidadePedidos: 0 };
        analiseAgrupadaTabela[chaveGrupoTabela].somaDias += diffDias; 
        analiseAgrupadaTabela[chaveGrupoTabela].quantidadePedidos += 1;
        
        const isoCode = mapEstadoParaISO(ufStandard);
        if (isoCode) { 
            if (!analiseAgrupadaMapaBR[isoCode]) analiseAgrupadaMapaBR[isoCode] = { somaDias: 0, quantidadePedidos: 0 };
            analiseAgrupadaMapaBR[isoCode].somaDias += diffDias; 
            analiseAgrupadaMapaBR[isoCode].quantidadePedidos += 1;
        }
    });

    if (filtroCepLimpo === "" && Object.keys(analiseAgrupadaMapaBR).length > 0) {
        if (divMapaCanvas && divMapaCard && isGoogleChartsReady && typeof google !== 'undefined' && google.visualization) {
            try {
                let dadosMapa = [ ["Region", "Média de Dias", "Quantidade"] ];
                Object.entries(analiseAgrupadaMapaBR).forEach(([iso, dados]) => dadosMapa.push([ iso, Math.round(dados.somaDias / dados.quantidadePedidos), dados.quantidadePedidos ]));
                const options = { region: 'BR', resolution: 'provinces', displayMode: 'regions', colorAxis: { colors: ['#a7f3d0', '#fef08a', '#fca5a5'] }, backgroundColor: 'transparent', datalessRegionColor: '#f1f5f9', legend: { textStyle: { color: '#475569', fontSize: 11 } } };
                new google.visualization.GeoChart(divMapaCanvas).draw(google.visualization.arrayToDataTable(dadosMapa), options);
                divMapaCard.style.display = 'block';
            } catch(mapErro) { divMapaCard.style.display = 'none'; }
        }
    } else if (divMapaCard) {
        divMapaCard.style.display = 'none';
    }

    let resultadosTabela = Object.values(analiseAgrupadaTabela).map(item => ({ 
        estado: item.estado, 
        cep: item.cep, 
        mediaDias: Math.round(item.somaDias / item.quantidadePedidos), 
        quantidade: item.quantidadePedidos 
    }));
    
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
        resultadosTabela.sort((a, b) => a.estado.localeCompare(b.estado));
    }
    
    tbody.innerHTML = '';
    if (resultadosTabela.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum histórico encontrado.</td></tr>`; 
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

export async function carregarDadosLogistica() {
    const tbody = document.getElementById('corpo-tabela-ceps');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Calculando médias logísticas...</td></tr>';
    
    // Dicionário de prefixos de CEP do Correios
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

    try {
        const res = await fetch('/api/relatorios/logistica');
        const json = await res.json();
        
        if (json.sucesso && json.dados.length > 0) {
            tbody.innerHTML = '';
            json.dados.forEach(item => {
                const prefixo = item.prefixo_cep;
                const estado = mapaEstados[prefixo] || `Região (CEP ${prefixo}.XXX)`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${estado}</td>
                    <td>Geral (Faixa ${prefixo})</td>
                    <td style="font-weight:bold; color: var(--primary);">${item.media_dias} dias</td>
                    <td>${item.volume} entregas mapeadas</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Nenhuma entrega mapeada ainda.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar dados.</td></tr>';
    }
}

// ==========================================
// PONTE GLOBAL (Tornando as funções visíveis para o HTML e app.js)
// ==========================================
window.ordenarTabelaCep = ordenarTabelaCep;
window.renderizarTabelaCEPs = renderizarTabelaCEPs;
