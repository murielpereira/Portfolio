export function getAbaEntregas() {
    return `
    <div id="sub-entregas" class="sub-pagina" style="display: none;">
        <div class="control-bar">
            <div>
                <h2 style="font-size: 18px; color: var(--text-main); margin-bottom: 4px;">Análise de Transportadoras</h2>
                <p style="font-size: 13px; color: var(--text-muted);">Métricas de frete, tempo de entrega e distribuição de envios.</p>
            </div>
        </div>

        <div class="charts-grid" style="margin-bottom: 20px;">
            <div class="chart-card" id="grafico-transportadoras-div" style="padding: 20px; align-items: center; justify-content: center; display: flex;">
                <div class="loading-pulse" style="width: 150px;"></div>
            </div>
            <section class="card" style="padding: 0; overflow: hidden; height: 350px;">
                <div class="tabela-responsiva" style="height: 100%;">
                    <table class="tabela-dados">
                        <thead>
                            <tr><th>Transportadora</th><th>Volume</th><th>Custo Médio</th><th>Entrega Média</th></tr>
                        </thead>
                        <tbody id="corpo-tabela-transportadoras"><tr><td colspan="4" style="text-align: center; padding: 30px;">Carregando...</td></tr></tbody>
                    </table>
                </div>
            </section>
        </div>

        <section class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
                <h3 style="font-size: 16px; color: var(--text-main);">Performance por Estado</h3>
            </div>
            <div class="tabela-responsiva">
                <table class="tabela-dados">
                    <thead>
                        <tr><th>Estado (UF)</th><th>Transportadora</th><th>Volume de Envios</th><th>Tempo Médio</th></tr>
                    </thead>
                    <tbody id="corpo-tabela-entregas"><tr><td colspan="4" style="text-align: center; padding: 30px;">Carregando...</td></tr></tbody>
                </table>
            </div>
        </section>
    </div>`;
}