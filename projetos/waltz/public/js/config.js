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

export function getRegrasVIP() { return configsGlobais.regras_vip; }

export function preencherFormularioConfig() {
    const t = configsGlobais.templates_wpp;
    if (t) {
        ['aprovado', 'fabricacao', 'rastreio', 'rota', 'feedback'].forEach(id => {
            if(document.getElementById(`msg-${id}`)) document.getElementById(`msg-${id}`).value = t[id] || '';
            if(document.getElementById(`cfg-ativo-${id}`)) document.getElementById(`cfg-ativo-${id}`).checked = t[`ativo_${id}`] !== false; // Default true
        });
    }
    const r = configsGlobais.regras_vip;
    if (r) {
        if(document.getElementById('cfg-diamante')) document.getElementById('cfg-diamante').value = r.diamante;
        if(document.getElementById('cfg-ouro')) document.getElementById('cfg-ouro').value = r.ouro;
        if(document.getElementById('cfg-prata')) document.getElementById('cfg-prata').value = r.prata;
    }
    if (document.getElementById('cfg-whatsapp-ativo')) {
        document.getElementById('cfg-whatsapp-ativo').checked = configsGlobais.whatsapp_ativo;
    }
}

// FIX: A função de envio de teste manual para o seu número!
export function testarMensagemWpp(tipo) {
    const textarea = document.getElementById(`msg-${tipo}`);
    if(!textarea) return;
    
    let textoFinal = textarea.value
        .replace(/{nome}/g, 'Maria')
        .replace(/{pedido}/g, '54321')
        .replace(/{rastreio}/g, 'BR123456789BR')
        .replace(/{link_rastreio}/g, 'https://rastreio.com/BR123456789BR')
        .replace(/{produtos}/g, 'Coleira Rosa Bebê (M), Guia Ouro');
        
    window.open(`https://wa.me/5548991574943?text=${encodeURIComponent(textoFinal)}`, '_blank');
}

export async function salvarConfiguracoes(event) {
    event.preventDefault();
    const btn = event.submitter;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = 'Salvando no Banco...'; btn.style.opacity = '0.7';

    const whatsapp_ativo = document.getElementById('cfg-whatsapp-ativo') ? document.getElementById('cfg-whatsapp-ativo').checked : false;
    
    const templates_wpp = {
        aprovado: document.getElementById('msg-aprovado')?.value, ativo_aprovado: document.getElementById('cfg-ativo-aprovado')?.checked,
        fabricacao: document.getElementById('msg-fabricacao')?.value, ativo_fabricacao: document.getElementById('cfg-ativo-fabricacao')?.checked,
        rastreio: document.getElementById('msg-rastreio')?.value, ativo_rastreio: document.getElementById('cfg-ativo-rastreio')?.checked,
        rota: document.getElementById('msg-rota')?.value, ativo_rota: document.getElementById('cfg-ativo-rota')?.checked,
        feedback: document.getElementById('msg-feedback')?.value, ativo_feedback: document.getElementById('cfg-ativo-feedback')?.checked,
    };
    
    const regras_vip = {
        diamante: parseFloat(document.getElementById('cfg-diamante')?.value) || 6000,
        ouro: parseFloat(document.getElementById('cfg-ouro')?.value) || 3000,
        prata: parseFloat(document.getElementById('cfg-prata')?.value) || 1000
    };

    try {
        const res = await fetch('/api/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templates_wpp, regras_vip, whatsapp_ativo }) });
        if (res.ok) {
            configsGlobais.templates_wpp = templates_wpp; configsGlobais.regras_vip = regras_vip; configsGlobais.whatsapp_ativo = whatsapp_ativo;
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