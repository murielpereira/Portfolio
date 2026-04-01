export function getAbaDash() {
    return `
    <div id="sub-dash" class="sub-pagina" style="display: none;">
        <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;"><i data-lucide="users"></i></div><div class="kpi-info"><h3>Clientes</h3><div class="value">27.935</div></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:#ecfdf5; color:#10b981;"><i data-lucide="shopping-cart"></i></div><div class="kpi-info"><h3>Pedidos</h3><div class="value">7.485</div></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:#fffbeb; color:#f59e0b;"><i data-lucide="truck"></i></div><div class="kpi-info"><h3>Entregas Pendentes</h3><div class="value">342</div></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:#fef2f2; color:#ef4444;"><i data-lucide="mail"></i></div><div class="kpi-info"><h3>E-mails Enviados</h3><div class="value">1.204</div></div></div>
        </div>
        <div class="charts-grid">
            <div class="chart-card" id="grafico-clientes-div" style="padding: 20px; align-items: center;">Carregando gráfico...</div>
            <div class="chart-card">Desempenho logístico — em breve</div>
        </div>
    </div>`;
}