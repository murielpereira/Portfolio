import { atualizarIcones } from './utils.js';

export let configsGlobais = {
    templates_wpp: null,
    regras_vip: { diamante: 6000, ouro: 3000, prata: 1000 },
    whatsapp_ativo: false 
};

export async function carregarConfiguracoesDoBanco() {
    try {
        const res = await fetch('/api/configuracoes');
        const data = await res.json();
        if (data.sucesso && data.config) {
            if (data.config.templates_wpp) configsGlobais.templates_wpp = data.config.templates_wpp;
            if (data.config.regras_vip) configsGlobais.regras_vip = data.config.regras_vip;
            if (data.config.whatsapp_ativo !== undefined) configsGlobais.whatsapp_ativo = data.config.whatsapp_ativo;
        }
    } catch (e) {}
}

// FIX: Força a conversão para Número para o gráfico não quebrar!
export function getRegrasVIP() { 
    return {
        diamante: Number(configsGlobais.regras_vip.diamante) || 6000,
        ouro: Number(configsGlobais.regras_vip.ouro) || 3000,
        prata: Number(configsGlobais.regras_vip.prata) || 1000
    }; 
}

export function preencherFormularioConfig() {
    const t = configsGlobais.templates_wpp;
    if (t) {
        ['aprovado', 'fabricacao', 'rastreio', 'rota', 'feedback'].forEach(id => {
            if(document.getElementById(`msg-${id}`)) document.getElementById(`msg-${id}`).value = t[id] || '';
            if(document.getElementById(`cfg-ativo-${id}`)) document.getElementById(`cfg-ativo-${id}`).checked = t[`ativo_${id}`] !== false; 
        });
    }
    const r = configsGlobais.regras_vip;
    if (r) {
        if(document.getElementById('cfg-diamante')) document.getElementById('cfg-diamante').value = r.diamante;
        if(document.getElementById('cfg-ouro')) document.getElementById('cfg-ouro').value = r.ouro;
        if(document.getElementById('cfg-prata')) document.getElementById('cfg-prata').value = r.prata;
    }
}

// FIX: Agora envia para a fila do Backend!
export async function testarMensagemWpp(tipo) {
    const textarea = document.getElementById(`msg-${tipo}`);
    const btn = document.getElementById(`btn-testar-${tipo}`);
    if(!textarea || !btn) return;
    
    let textoFinal = textarea.value
        .replace(/{nome}/g, 'Maria')
        .replace(/{pedido}/g, '54321')
        .replace(/{rastreio}/g, 'BR123456789BR')
        .replace(/{link_rastreio}/g, 'https://rastreio.com/BR123456789BR')
        .replace(/{produtos}/g, 'Coleira Rosa Bebê (M), Guia Ouro');
        
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = 'Enviando...'; btn.style.opacity = '0.7';

    try {
        const res = await fetch('/api/whatsapp/testar', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: textoFinal })
        });
        if (res.ok) {
            btn.innerHTML = '✅ Na Fila!'; btn.style.backgroundColor = '#10b981'; btn.style.color = 'white';
        } else throw new Error();
    } catch (e) {
        btn.innerHTML = '❌ Erro'; btn.style.backgroundColor = '#ef4444'; btn.style.color = 'white';
    }

    setTimeout(() => { btn.innerHTML = textoOriginal; btn.style.backgroundColor = 'white'; btn.style.color = '#475569'; btn.style.opacity = '1'; atualizarIcones(); }, 2500);
}

export async function salvarConfiguracoes(event) {
    event.preventDefault();
    const btn = event.submitter;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = 'Salvando no Banco...'; btn.style.opacity = '0.7';
    
    const templates_wpp = {
        aprovado: document.getElementById('msg-aprovado')?.value || configsGlobais.templates_wpp.aprovado, 
        ativo_aprovado: document.getElementById('cfg-ativo-aprovado')?.checked !== undefined ? document.getElementById('cfg-ativo-aprovado').checked : configsGlobais.templates_wpp.ativo_aprovado,
        fabricacao: document.getElementById('msg-fabricacao')?.value || configsGlobais.templates_wpp.fabricacao, 
        ativo_fabricacao: document.getElementById('cfg-ativo-fabricacao')?.checked !== undefined ? document.getElementById('cfg-ativo-fabricacao').checked : configsGlobais.templates_wpp.ativo_fabricacao,
        rastreio: document.getElementById('msg-rastreio')?.value || configsGlobais.templates_wpp.rastreio, 
        ativo_rastreio: document.getElementById('cfg-ativo-rastreio')?.checked !== undefined ? document.getElementById('cfg-ativo-rastreio').checked : configsGlobais.templates_wpp.ativo_rastreio,
        rota: document.getElementById('msg-rota')?.value || configsGlobais.templates_wpp.rota, 
        ativo_rota: document.getElementById('cfg-ativo-rota')?.checked !== undefined ? document.getElementById('cfg-ativo-rota').checked : configsGlobais.templates_wpp.ativo_rota,
        feedback: document.getElementById('msg-feedback')?.value || configsGlobais.templates_wpp.feedback, 
        ativo_feedback: document.getElementById('cfg-ativo-feedback')?.checked !== undefined ? document.getElementById('cfg-ativo-feedback').checked : configsGlobais.templates_wpp.ativo_feedback,
    };
    
    // FIX: Preserva as configurações antigas se o input não estiver na tela!
    const regras_vip = {
        diamante: parseFloat(document.getElementById('cfg-diamante')?.value) || configsGlobais.regras_vip.diamante,
        ouro: parseFloat(document.getElementById('cfg-ouro')?.value) || configsGlobais.regras_vip.ouro,
        prata: parseFloat(document.getElementById('cfg-prata')?.value) || configsGlobais.regras_vip.prata
    };

    try {
        const res = await fetch('/api/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templates_wpp, regras_vip, whatsapp_ativo: false }) });
        if (res.ok) {
            configsGlobais.templates_wpp = templates_wpp; configsGlobais.regras_vip = regras_vip; 
            if (window.renderizarPaginaRelatorio) window.renderizarPaginaRelatorio();
            if (window.renderizarGraficoClientes) window.renderizarGraficoClientes();
            btn.innerHTML = '<i data-lucide="check" style="width:18px; height:18px;"></i> Salvo!'; btn.style.backgroundColor = '#10b981';
        } else { throw new Error('Falha no backend'); }
    } catch (e) { btn.innerHTML = '❌ Erro de Conexão'; btn.style.backgroundColor = '#ef4444'; }
    
    atualizarIcones();
    setTimeout(() => { btn.innerHTML = textoOriginal; btn.style.backgroundColor = ''; btn.style.opacity = '1'; atualizarIcones(); }, 2500);
}

window.salvarConfiguracoes = salvarConfiguracoes;
window.getRegrasVIP = getRegrasVIP;
window.configsGlobais = configsGlobais;
window.testarMensagemWpp = testarMensagemWpp;