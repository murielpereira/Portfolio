export function getAbaDash() {
    return `
    <div id="sub-dash" class="sub-pagina" style="display: none;">
        <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;"><i data-lucide="users"></i></div><div class="kpi-info"><h3>Total de Clientes</h3><<div class="value" id="kpi-clientes"><div class="loading-pulse"></div></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:#ecfdf5; color:#10b981;"><i data-lucide="shopping-cart"></i></div><div class="kpi-info"><h3>Pedidos em Aberto</h3><div class="value" id="kpi-abertos"><div class="loading-pulse"></div></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:#fffbeb; color:#f59e0b;"><i data-lucide="truck"></i></div><div class="kpi-info"><h3>Entregas Pendentes</h3><div class="value" id="kpi-pendentes"><div class="loading-pulse"></div></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:#fef2f2; color:#ef4444;"><i data-lucide="clock"></i></div><div class="kpi-info"><h3>Tempo Médio de Envio (15 dias)</h3><div class="value" id="kpi-tempo-envio"><div class="loading-pulse"></div></div></div>
        </div>
        <div class="charts-grid">
            <div class="chart-card" id="grafico-clientes-div" style="padding: 20px; align-items: center;">Carregando gráfico de clientes...</div>
            <div class="chart-card">
                <h3 style="font-size:16px; margin-bottom:15px; color:var(--text-main);">Visão Geral</h3>
                <p style="color:var(--text-muted); font-size:14px;">Os dados do Dashboard são calculados em tempo real com base no seu histórico logístico e na sua base de clientes sincronizada com o Tiny.</p>
            </div>
        </div>
    </div>`;
}