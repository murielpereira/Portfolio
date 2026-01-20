fetch('../menu.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('menu-placeholder').innerHTML = data;
})

// --- ÍCONES E UTILITÁRIOS ---
const icons = {
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    truck: `<svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
    box: `<svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`,
    dot: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`,
    help: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff7b00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`
};

function obterLogo(nomeServico) {
    if (!nomeServico) return 'https://cdn-icons-png.flaticon.com/512/713/713311.png';
    const nome = nomeServico.toLowerCase();
    if (nome.includes('loggi')) return 'https://logodownload.org/wp-content/uploads/2019/07/loggi-logo-0.png';
    if (nome.includes('pac')) return 'https://logodownload.org/wp-content/uploads/2017/03/pac-correios-logo-1.png';
    if (nome.includes('sedex')) return 'https://logodownload.org/wp-content/uploads/2017/03/sedex-logo-1.png';
    if (nome.includes('total')) return 'https://logodownload.org/wp-content/uploads/2019/09/total-express-logo-0.png';
    if (nome.includes('j&t')) return 'https://images.seeklogo.com/logo-png/33/1/jt-express-logo-png_seeklogo-336498.png';
    if (nome.includes('jadlog')) return 'https://logodownload.org/wp-content/uploads/2019/02/jadlog-logo-0.png';
    return 'https://cdn-icons-png.flaticon.com/512/713/713311.png';
}

function obterIcone(tipo) {
    if (tipo === 'DELIVERED') return { svg: icons.check, classe: 'entregue' };
    if (tipo === 'IN TRANSIT') return { svg: icons.truck, classe: 'transito' };
    if (tipo === 'POSTED') return { svg: icons.box, classe: 'pendente' };
    return { svg: icons.dot, classe: 'padrao' };
}

function copiarCodigo(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        const toast = document.getElementById("toast");
        toast.className = "mostrar";
        setTimeout(() => { toast.className = toast.className.replace("mostrar", ""); }, 3000);
    }).catch(err => console.error('Erro ao copiar', err));
}

async function pesquisar() {
    const inputCodigo = document.getElementById('codigo');
    const codigo = inputCodigo.value.trim();
    const divResultado = document.getElementById('resultado');

    if (!codigo) { alert("Digite o código!"); return; }
    inputCodigo.value = ""; 

    divResultado.style.display = "block";
    divResultado.innerHTML = "<p style='width:100%; text-align:center; font-size:1.2em; color:#888'>A carregar dados...</p>";

    // CONFIGURAÇÕES API
    const proxy = "https://cors-anywhere.herokuapp.com/"; 
    const api_url = "https://api.smartenvios.com/v1/freight-order/tracking";
    const token = "NY2WulkhIl8n4Ttbqjj25zhmdyvikro"; 

    try {
        const resposta = await fetch(proxy + api_url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json", "token": token },
            body: JSON.stringify({ "tracking_code": codigo })
        });

        if (!resposta.ok) throw new Error("Erro de conexão (Verifique o Proxy)");

        const json = await resposta.json();
        const r = json.result;

        if (!r) { divResultado.innerHTML = "<p style='width:100%; text-align:center'>Código não encontrado.</p>"; return; }

        // --- ORDENAÇÃO ROBUSTA (AQUI ESTÁ A CORREÇÃO PRINCIPAL) ---
        // Ordena o array pela data: Mais recente (b) - Mais antigo (a)
        const eventos = (r.trackings || []).sort((a, b) => new Date(b.date) - new Date(a.date));

        // --- PROGRESSO ---
        let progresso = 0; 
        let statusEntregue = false;
        if (eventos.length > 0) progresso = 33; 
        
        // O evento [0] agora é SEMPRE o mais recente devido ao sort()
        const ultimoEvento = eventos[0];
        
        if (ultimoEvento && ultimoEvento.code.tracking_type === 'DELIVERED') {
            progresso = 100;
            statusEntregue = true;
        } else if (eventos.length > 1) {
            progresso = 66; 
        }

        // Previsão
        let textoPrevisao = "Sob Consulta";
        let estiloPrevisao = "color: #888;";
        if (r.delivery_prevision) {
            textoPrevisao = new Date(r.delivery_prevision).toLocaleDateString('pt-BR');
            estiloPrevisao = "color: #ffc107;";
        }

        // --- HTML TIMELINE ---
        let timelineHTML = '';
        eventos.forEach((ev) => {
            // Formatação de data/hora
            const dataObj = new Date(ev.date);
            const dataStr = dataObj.toLocaleDateString('pt-BR');
            const horaStr = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const infoIcone = obterIcone(ev.code.tracking_type);
            
            timelineHTML += `
                <div class="timeline-item ${infoIcone.classe}">
                    <div class="timeline-icon-box">${infoIcone.svg}</div>
                    <div class="status-titulo">${ev.code.name}</div>
                    <div class="status-desc">${ev.observation || ''}</div>
                    <div class="status-data">${dataStr} às ${horaStr}</div>
                </div>
            `;
        });

        // --- HTML FINAL ---
        divResultado.style.display = "grid";
        divResultado.innerHTML = `
            <div class="card">
                <div class="pedido-header">
                    <div class="codigo-copiavel" onclick="copiarCodigo('${r.tracking_code}')" title="Clique para copiar">
                        <div><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/></svg></div>
                        <span>${r.tracking_code}</span>
                        <div class="icone-copiar">${icons.copy}</div> 
                    </div>
                    <span class="badge-rastreio">RASTREIO</span>
                </div>

                <div class="progress-container">
                    <div class="progress-line-bg"></div>
                    <div class="progress-line-fill" style="width: ${statusEntregue ? '100%' : (progresso === 66 ? '50%' : '0%')}"></div>
                    <div class="progress-step ${progresso >= 33 ? 'active' : ''}">
                        <div class="step-circle">${icons.box}</div>
                        <div class="step-label">Postado</div>
                    </div>
                    <div class="progress-step ${progresso >= 66 ? 'active' : ''}">
                        <div class="step-circle">${icons.truck}</div>
                        <div class="step-label">Em rota</div>
                    </div>
                    <div class="progress-step ${progresso === 100 ? 'active' : ''}">
                        <div class="step-circle">${icons.check}</div>
                        <div class="step-label">Entregue</div>
                    </div>
                </div>
                
                <div class="timeline">
                    ${timelineHTML}
                </div>
            </div>

            <div class="coluna-direita">
                <div class="card" style="display:flex; gap:15px; align-items:center;">
                        <div style="background:#1a1a1a; padding:10px; border-radius:10px; border:1px solid #333">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff7b00"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>
                        <div>
                        <div class="card-header">Destinatário</div>
                        <div class="card-value">${r.destiny_name}</div>
                        <div style="color: #aaa; margin-top:5px; font-size:0.9em">
                            ${r.destiny_city_name || ''} - ${r.destiny_uf || ''}
                        </div>
                        </div>
                </div>

                <div class="card">
                    <div class="card-header">Transportadora</div>
                    <div class="transportadora-info" style="margin-bottom: 20px;">
                        <img src="${obterLogo(r.service_name)}" class="logo-img">
                        <div>
                            <div class="card-value">${r.service_name}</div>
                        </div>
                    </div>

                    <div class="card-header">Previsão de Entrega</div>
                    <div class="card-value" style="${estiloPrevisao}">
                        ${textoPrevisao}
                    </div>
                </div>

                <a href="https://wa.me/5548991574943" target="_blank" class="card card-ajuda">
                    ${icons.help}
                    <span style="color: #ff7b00; font-weight: bold;">Precisa de ajuda? Fale conosco</span>
                </a>

                <a href="https://portal.smartenvios.com/rastreamento/codigo-de-rastreio/${r.tracking_code}" target="_blank" class="link-discreto">
                    + Ver detalhes no site oficial
                </a>
            </div>
        `;

    } catch (erro) {
        console.error(erro);
        divResultado.innerHTML = `<p style="color:red; text-align:center">Erro: ${erro.message}</p>`;
    }
}