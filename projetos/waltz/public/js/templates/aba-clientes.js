export function getAbaClientes() {
    return `
    <div id="sub-tiny" class="sub-pagina" style="display: none;">
        <div class="control-bar" style="flex-wrap: nowrap;">
            <div class="control-filters" style="flex-wrap: nowrap; flex: 1;">
                <div class="control-search">
                    <i data-lucide="search"></i>
                    <input type="text" id="busca-tiny-v2" class="input-modern" placeholder="Nome ou Documento..." onkeyup="renderizarPaginaClientes()">
                </div>
                <select id="filtro-grupo-v2" class="input-modern control-select" onchange="renderizarPaginaClientes()">
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
                            <th onclick="ordenarTabela(0)" style="cursor:pointer">Nome <span class="sort-icon" id="sort-icon-0">↑↓</span></th>
                            <th onclick="ordenarTabela(1)" style="cursor:pointer">Grupo <span class="sort-icon" id="sort-icon-1">↑↓</span></th> 
                            <th onclick="ordenarTabela(2)" style="cursor:pointer">Último Pedido <span class="sort-icon" id="sort-icon-2">↑↓</span></th>
                            <th onclick="ordenarTabela(3)" style="cursor:pointer">Pedidos <span class="sort-icon" id="sort-icon-3">↑↓</span></th>
                            <th onclick="ordenarTabela(4)" style="cursor:pointer">Ticket Médio <span class="sort-icon" id="sort-icon-4">↑↓</span></th>
                            <th onclick="ordenarTabela(5)" style="cursor:pointer">Entrega Média <span class="sort-icon" id="sort-icon-5">↑↓</span></th>
                            <th onclick="ordenarTabela(6)" style="cursor:pointer">Valor Total <span class="sort-icon" id="sort-icon-6">↑↓</span></th>
                        </tr>
                    </thead>
                    <tbody id="tabela-clientes-body"><tr><td colspan="7" style="text-align:center; padding: 30px;">Carregando...</td></tr></tbody>
                </table>
            </div>
            <div class="paginacao-controles" id="paginacao-ltv"></div>
        </section>
    </div>`;
}