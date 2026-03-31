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
    
    // ATENÇÃO AQUI: Precisamos buscar os pedidos da window, pois a variável vive lá agora.
    if (!window.todosOsPedidosNuvem) return;

    window.todosOsPedidosNuvem.forEach(p => {
        if (!p.data_envio || !p.data_entrega) return;
        const status = (p.status_nuvemshop || '').toUpperCase();
        if (status !== 'ENTREGUE' && status !== 'ARQUIVADO') return;
        const cepLimpo = (p.cep || '').replace(/\D/g, '');
        const ufStandard = normalizarNomeEstado(p.estado || 'Não Informado');
        if (filtroCepLimpo && !cepLimpo.includes(filtroCepLimpo)) return;
        const diffDias = Math.ceil(Math.abs(new Date(p.data_entrega) - new Date(p.data_envio)) / (1000 * 60 * 60 * 24));
        
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

window.ordenarTabelaCep = ordenarTabelaCep;
window.renderizarTabelaCEPs = renderizarTabelaCEPs;