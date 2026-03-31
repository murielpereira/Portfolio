// ==========================================
// ARQUIVO: public/js/config.js
// Objetivo: Comunicação com o Banco para Configurações
// ==========================================
import { atualizarIcones } from './utils.js';

export let configsGlobais = {
    templates_wpp: null,
    regras_vip: { diamante: 6000, ouro: 3000, prata: 1000 }
};

export async function carregarConfiguracoesDoBanco() {
    try {
        const res = await fetch('/api/configuracoes');
        const data = await res.json();
        if (data.sucesso && data.config) {
            if (data.config.templates_wpp) configsGlobais.templates_wpp = data.config.templates_wpp;
            if (data.config.regras_vip) configsGlobais.regras_vip = data.config.regras_vip;
        }
    } catch (e) { console.error('Erro config locais'); }
}

export function getRegrasVIP() {
    return configsGlobais.regras_vip;
}

export function preencherFormularioConfig() {
    const t = configsGlobais.templates_wpp;
    if (t) {
        if(document.getElementById('msg-aprovado')) document.getElementById('msg-aprovado').value = t.aprovado || '';
        if(document.getElementById('msg-fabricacao')) document.getElementById('msg-fabricacao').value = t.fabricacao || '';
        if(document.getElementById('msg-rastreio')) document.getElementById('msg-rastreio').value = t.rastreio || '';
        if(document.getElementById('msg-rota')) document.getElementById('msg-rota').value = t.rota || '';
        if(document.getElementById('msg-feedback')) document.getElementById('msg-feedback').value = t.feedback || '';
    }
    const r = configsGlobais.regras_vip;
    if (r) {
        if(document.getElementById('cfg-diamante')) document.getElementById('cfg-diamante').value = r.diamante;
        if(document.getElementById('cfg-ouro')) document.getElementById('cfg-ouro').value = r.ouro;
        if(document.getElementById('cfg-prata')) document.getElementById('cfg-prata').value = r.prata;
    }
}

export async function salvarConfiguracoes(event) {
    event.preventDefault();
    const btn = event.submitter;
    const textoOriginal = btn.innerHTML;
    
    btn.innerHTML = 'Salvando no Banco...';
    btn.style.opacity = '0.7';
    
    const templates_wpp = {
        aprovado: document.getElementById('msg-aprovado').value,
        fabricacao: document.getElementById('msg-fabricacao').value,
        rastreio: document.getElementById('msg-rastreio').value,
        rota: document.getElementById('msg-rota').value,
        feedback: document.getElementById('msg-feedback').value,
    };
    
    const regras_vip = {
        diamante: parseFloat(document.getElementById('cfg-diamante').value) || 6000,
        ouro: parseFloat(document.getElementById('cfg-ouro').value) || 3000,
        prata: parseFloat(document.getElementById('cfg-prata').value) || 1000
    };

    try {
        const res = await fetch('/api/configuracoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templates_wpp, regras_vip })
        });
        
        if (res.ok) {
            configsGlobais.templates_wpp = templates_wpp;
            configsGlobais.regras_vip = regras_vip;
            
            if (window.renderizarPaginaRelatorio) window.renderizarPaginaRelatorio();
            if (window.renderizarGraficoClientes) window.renderizarGraficoClientes();
            
            btn.innerHTML = '<i data-lucide="check" style="width:18px; height:18px;"></i> Salvo!';
            btn.style.backgroundColor = '#10b981';
        } else { throw new Error('Falha no backend'); }
    } catch (e) {
        btn.innerHTML = '❌ Erro de Conexão';
        btn.style.backgroundColor = '#ef4444';
    }
    
    atualizarIcones();
    setTimeout(() => { btn.innerHTML = textoOriginal; btn.style.backgroundColor = ''; btn.style.opacity = '1'; atualizarIcones(); }, 2500);
}

// Vinculando ao HTML
window.salvarConfiguracoes = salvarConfiguracoes;
window.getRegrasVIP = getRegrasVIP;
window.configsGlobais = configsGlobais;