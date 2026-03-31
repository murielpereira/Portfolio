// ==========================================
// ARQUIVO: public/js/utils.js
// Objetivo: Funções auxiliares e formatações
// ==========================================

export let isGoogleChartsReady = false;

export function inicializarIcones() {
    const scriptLucide = document.createElement('script');
    scriptLucide.src = 'https://unpkg.com/lucide@latest';
    scriptLucide.onload = () => { if (window.lucide) window.lucide.createIcons(); };
    document.head.appendChild(scriptLucide);
}

export function atualizarIcones() { 
    if (window.lucide) window.lucide.createIcons(); 
}

export function inicializarGoogleCharts() {
    const scriptGoogle = document.createElement('script');
    scriptGoogle.src = 'https://www.gstatic.com/charts/loader.js';
    scriptGoogle.onload = () => {
        try {
            google.charts.load('current', { 'packages': ['geochart', 'corechart'], 'language': 'pt-br' });
            google.charts.setOnLoadCallback(() => {
                isGoogleChartsReady = true;
                // A função renderizarTabelaCEPs será chamada através do window depois
                const abaCep = document.getElementById('sub-cep');
                if (abaCep && abaCep.style.display === 'block' && window.renderizarTabelaCEPs) {
                    window.renderizarTabelaCEPs();
                }
            });
        } catch (e) { console.error(e); }
    };
    document.head.appendChild(scriptGoogle);
}

export function formatarDocumento(doc) {
    if (!doc) return '-';
    const num = doc.replace(/\D/g, '');
    if (num.length === 11) return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (num.length === 14) return num.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return doc;
}

export function formatarWhatsAppClicavel(telefone) {
    if (!telefone) return '-';
    const num = telefone.replace(/\D/g, '');
    if (num.length < 10) return telefone;
    let ddd = num.substring(0, 2); let resto = num.substring(2);
    let link = `https://wa.me/55${num}`;
    let txt = `(${ddd}) ${resto.length === 9 ? resto.substring(0, 5) + '-' + resto.substring(5) : resto.substring(0, 4) + '-' + resto.substring(4)}`;
    return `<a href="${link}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">${txt}</a>`;
}

export function toggleSenha() {
    const input = document.getElementById('senha');
    const icone = document.getElementById('icone-senha');
    if (input && icone) {
        if (input.type === 'password') { input.type = 'text'; icone.innerText = 'visibility_off'; } 
        else { input.type = 'password'; icone.innerText = 'visibility'; }
    }
}

// Vinculando funções ao HTML
window.toggleSenha = toggleSenha;