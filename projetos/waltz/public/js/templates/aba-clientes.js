export function getAbaClientes() {
    return `
    <div id="sub-tiny" class="sub-pagina" style="display: none;">
        <div class="control-bar">
            <div class="control-filters">
                <div class="control-search">
                    <i data-lucide="search"></i>
                    <input type="text" id="busca-tiny-v2" class="input-modern" placeholder="Nome ou Documento..." onkeyup="resetarEPaginacao()">
                </div>
                <select id="filtro-grupo-v2" class="input-modern control-select" onchange="resetarEPaginacao()">
                    <option value="TODOS">Todos os Grupos</option>
                    <option value="SEM COMPRAS">Sem Compras</option>
                    <option value="PRIMEIRA COMPRA">1ª Compra</option>
                    <option value="BRONZE">Bronze</option>
                    <option value="PRATA">Prata</option>
                    <option value="OURO">Ouro</option>
                    <option value="DIAMANTE">Diamante</option>
                </select>
            </div>
            <span id="contador-cadastros" class="control-badge">0 cadastro(s)</span>
        </div>

        <section class="card" style="padding: 0; overflow: hidden;">
            <div class="tabela-responsiva">
                <table class="tabela-dados">
                <thead>
                        <tr>
                            <th onclick="ordenarTabela(0)">Nome <span class="sort-icon" id="sort-icon-0">↑↓</span></th>
                            <th onclick="ordenarTabela(5)">Grupo <span class="sort-icon" id="sort-icon-5">↑↓</span></th> 
                            <th>Último Pedido</th>
                            <th onclick="ordenarTabela(6)">Pedidos <span class="sort-icon" id="sort-icon-6">↑↓</span></th>
                            <th onclick="ordenarTabela(7)">Ticket Médio <span class="sort-icon" id="sort-icon-7">↑↓</span></th>
                            <th onclick="ordenarTabela(8)">Entrega <span class="sort-icon" id="sort-icon-8">↑↓</span></th>
                            <th onclick="ordenarTabela(9)">Valor Total <span class="sort-icon" id="sort-icon-9">↑↓</span></th>
                        </tr>
                    </thead>
                    <tbody id="tabela-clientes-body"><tr><td colspan="7" style="text-align:center; padding: 30px;">Carregando...</td></tr></tbody>
                </table>
            </div>
            <div class="paginacao-controles" id="paginacao-ltv"></div>
        </section>
    </div>`;
}