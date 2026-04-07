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

export function getRegrasVIP() { 
    const r = configsGlobais.regras_vip || {};
    return {
        diamante: Number(r.diamante) || 6000,
        ouro: Number(r.ouro) || 3000,
        prata: Number(r.prata) || 1000
    }; 
}

export function preencherFormularioConfig() {
    const t = configsGlobais.templates_wpp || {};
    ['aprovado', 'fabricacao', 'rastreio', 'rota', 'feedback'].forEach(id => {
        const txt = document.getElementById(`msg-${id}`);
        const chk = document.getElementById(`cfg-ativo-${id}`);
        if(txt) txt.value = t[id] || '';
        if(chk) chk.checked = t[`ativo_${id}`] !== false; 
    });
    
    const r = configsGlobais.regras_vip || {};
    if(document.getElementById('cfg-diamante')) document.getElementById('cfg-diamante').value = r.diamante || 6000;
    if(document.getElementById('cfg-ouro')) document.getElementById('cfg-ouro').value = r.ouro || 3000;
    if(document.getElementById('cfg-prata')) document.getElementById('cfg-prata').value = r.prata || 1000;
    
    if (document.getElementById('cfg-whatsapp-ativo')) {
        document.getElementById('cfg-whatsapp-ativo').checked = configsGlobais.whatsapp_ativo === true;
    }

    const h = configsGlobais.horarios_wpp || { inicio: '08:00', fim: '18:00', dias: [1,2,3,4,5] };
    if(document.getElementById('cfg-hora-inicio')) document.getElementById('cfg-hora-inicio').value = h.inicio;
    if(document.getElementById('cfg-hora-fim')) document.getElementById('cfg-hora-fim').value = h.fim;
    document.querySelectorAll('.cfg-dias').forEach(cb => { cb.checked = h.dias.includes(parseInt(cb.value)); });
}

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
    
    const t = configsGlobais.templates_wpp || {};
    const r = configsGlobais.regras_vip || {};

    const whatsapp_ativo = document.getElementById('cfg-whatsapp-ativo') !== null 
        ? document.getElementById('cfg-whatsapp-ativo').checked 
        : (configsGlobais.whatsapp_ativo === true);
    
    const templates_wpp = {
        aprovado: document.getElementById('msg-aprovado')?.value ?? t.aprovado ?? '', 
        ativo_aprovado: document.getElementById('cfg-ativo-aprovado')?.checked ?? t.ativo_aprovado ?? true,
        fabricacao: document.getElementById('msg-fabricacao')?.value ?? t.fabricacao ?? '', 
        ativo_fabricacao: document.getElementById('cfg-ativo-fabricacao')?.checked ?? t.ativo_fabricacao ?? true,
        rastreio: document.getElementById('msg-rastreio')?.value ?? t.rastreio ?? '', 
        ativo_rastreio: document.getElementById('cfg-ativo-rastreio')?.checked ?? t.ativo_rastreio ?? true,
        rota: document.getElementById('msg-rota')?.value ?? t.rota ?? '', 
        ativo_rota: document.getElementById('cfg-ativo-rota')?.checked ?? t.ativo_rota ?? true,
        feedback: document.getElementById('msg-feedback')?.value ?? t.feedback ?? '', 
        ativo_feedback: document.getElementById('cfg-ativo-feedback')?.checked ?? t.ativo_feedback ?? true,
    };
    
    const regras_vip = {
        diamante: parseFloat(document.getElementById('cfg-diamante')?.value) || r.diamante || 6000,
        ouro: parseFloat(document.getElementById('cfg-ouro')?.value) || r.ouro || 3000,
        prata: parseFloat(document.getElementById('cfg-prata')?.value) || r.prata || 1000
    };

    // FIX: Ler os horários ANTES de enviar para o banco
    const diasSelecionados = Array.from(document.querySelectorAll('.cfg-dias:checked')).map(cb => parseInt(cb.value));
    const horarios_wpp = {
        inicio: document.getElementById('cfg-hora-inicio')?.value || '08:00',
        fim: document.getElementById('cfg-hora-fim')?.value || '18:00',
        dias: diasSelecionados.length > 0 ? diasSelecionados : [1,2,3,4,5]
    };

    try {
        // FIX: Adicionado horarios_wpp no pacote de envio (JSON.stringify)
        const res = await fetch('/api/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templates_wpp, regras_vip, whatsapp_ativo, horarios_wpp }) });
        if (res.ok) {
            configsGlobais.templates_wpp = templates_wpp; 
            configsGlobais.regras_vip = regras_vip; 
            configsGlobais.whatsapp_ativo = whatsapp_ativo;
            configsGlobais.horarios_wpp = horarios_wpp; // FIX: Guardar na memória local
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