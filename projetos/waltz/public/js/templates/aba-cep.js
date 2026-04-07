export function getAbaCep() {
    return `
    <div id="sub-cep" class="sub-pagina" style="display: none;">
        <div class="control-bar" style="flex-wrap: nowrap;">
            <div class="control-filters" style="flex-wrap: nowrap; flex: 1;">
                <div class="control-search">
                    <i data-lucide="search"></i>
                    <input type="text" id="busca-cep-analise" class="input-modern" placeholder="Buscar por Estado ou CEP..." onkeyup="if(typeof renderizarTabelaCEPs === 'function') renderizarTabelaCEPs()">
                </div>
            </div>
        </div>
        <section id="mapa_brasil_card" class="card" style="display:none; padding: 20px; margin-bottom: 20px; background:white; border-radius:12px; border:1px solid var(--border-color);">
            <h2 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Visualização Geográfica (Heatmap de Entrega)</h2>
            <div style="display: flex; justify-content: center; align-items: center; background: #f8fafc; border-radius: 8px; padding: 10px;"><div id="mapa_brasil_div" style="width: 100%; max-width: 650px; height: 350px;"></div></div>
        </section>
        <div class="card-table">
            <div class="tabela-responsiva">
                <table class="tabela-dados">
                    <thead>
                        <tr>
                            <th onclick="ordenarTabelaCep(0)" style="cursor:pointer">Estado (UF) <span class="sort-icon" id="sort-cep-0">↑↓</span></th>
                            <th onclick="ordenarTabelaCep(1)" style="cursor:pointer">CEP Base <span class="sort-icon" id="sort-cep-1">↑↓</span></th>
                            <th onclick="ordenarTabelaCep(2)" style="cursor:pointer">Média de Tempo <span class="sort-icon" id="sort-cep-2">↑↓</span></th>
                            <th onclick="ordenarTabelaCep(3)" style="cursor:pointer">Custo Médio (Frete) <span class="sort-icon" id="sort-cep-3">↑↓</span></th>
                            <th onclick="ordenarTabelaCep(4)" style="cursor:pointer">Volume <span class="sort-icon" id="sort-cep-4">↑↓</span></th>
                        </tr>
                    </thead>
                    <tbody id="corpo-tabela-ceps"><tr><td colspan="5" style="text-align: center; padding: 30px;">Aguardando processamento...</td></tr></tbody>
                </table>
            </div>
        </div>
    </div>`;
}