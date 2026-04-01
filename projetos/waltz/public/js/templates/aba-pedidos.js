export function getAbaPedidos() {
    return `
    <div id="sub-nuvem" class="sub-pagina" style="display: none;">
        <div class="control-bar" style="flex-wrap: nowrap;">
            <div class="control-filters" style="flex-wrap: nowrap; flex: 1;">
                <div class="control-search">
                    <i data-lucide="search"></i>
                    <input type="text" id="busca-nuvem-v2" class="input-modern" placeholder="Buscar pedido..." onkeyup="resetarPaginacaoNuvem()">
                </div>
                <select id="filtro-status-v2" class="input-modern control-select" onchange="resetarPaginacaoNuvem()">
                    <option value="TODOS">Todos os Status</option>
                    <option value="Aberto">Aberto</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                </select>
                <select id="filtro-automacao-v2" class="input-modern control-select" onchange="resetarPaginacaoNuvem()">
                    <option value="TODOS">Todas as Automações</option>
                    <option value="Aguardando Automação...">Aguardando Automação...</option>
                    <option value="1. Pedido Aprovado">1. Pedido Aprovado</option>
                    <option value="2. Em Fabricação">2. Em Fabricação</option>
                    <option value="3. Rastreio Enviado">3. Rastreio Enviado</option>
                    <option value="4. Em Rota / Entregue">4. Em Rota / Entregue</option>
                    <option value="5. Feedback Concluído">5. Feedback Concluído</option>
                </select>
            </div>
            <span id="contador-nuvem" class="control-badge">0 pedido(s)</span>
        </div>

        <section class="card" style="padding: 0; overflow: hidden;">
            <div class="tabela-responsiva">
                <table class="tabela-dados">
                    <thead>
                        <tr>
                            <th>Data/Hora <span class="sort-icon">↑↓</span></th>
                            <th>Pedido <span class="sort-icon">↑↓</span></th>
                            <th>Cliente <span class="sort-icon">↑↓</span></th>
                            <th>Status <span class="sort-icon">↑↓</span></th>
                            <th>Automações (Status WhatsApp)</th>
                        </tr>
                    </thead>
                    <tbody id="corpo-tabela-nuvem"><tr><td colspan="5" style="text-align: center; padding: 30px;">Carregando...</td></tr></tbody>
                </table>
            </div>
            <div class="paginacao-controles" id="paginacao-nuvem"></div>
        </section>
    </div>`;
}