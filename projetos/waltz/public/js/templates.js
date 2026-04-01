export function getTemplateLogin() {
    return `
    <div class="login-bg">
        <div class="glass-card">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="./logo.png" alt="Waltz" style="height: 50px; margin-bottom: 15px; border-radius: 8px; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
                <p style="color: #e2e8f0; font-size: 14px; margin: 0;">Acesse sua conta para continuar</p>
            </div>
            <form id="form-login">
                <div style="margin-bottom: 20px;">
                    <label for="usuario" style="display: block; margin-bottom: 8px; font-weight: 600; color: #f8fafc; font-size: 13px;">E-mail</label>
                    <input type="text" id="usuario" name="usuario" placeholder="seu@email.com" class="glass-input" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="senha" style="display: block; margin-bottom: 8px; font-weight: 600; color: #f8fafc; font-size: 13px;">Senha</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="senha" name="senha" placeholder="••••••••" class="glass-input" required>
                        <button type="button" id="btn-mostrar-senha" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #cbd5e1; display: flex;"><span class="material-symbols-outlined" id="icone-senha" style="font-size: 20px;">visibility</span></button>
                    </div>
                </div>
                <div style="text-align: right; margin-bottom: 30px;"><a href="#" style="color: #cbd5e1; font-size: 13px; text-decoration: none;">Esqueceu a senha?</a></div>
                <button type="submit" id="btn-login-submit" class="glass-btn">Entrar</button>
            </form>
        </div>
    </div>`;
}

export function getTemplatePainel() {
    return `
    <style>
        #dynamic-top-actions { display: none !important; }
        
        /* Ajuste 1: Filtros compactos e organizados */
        .control-bar {
            background: #ffffff; padding: 12px 16px; border-radius: 8px;
            border: 1px solid var(--border-color); margin-bottom: 20px;
            display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .control-filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        
        /* Ajuste da Lupa dentro do Input */
        .control-search { position: relative; width: 280px; } 
        .control-search i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; width: 16px; height: 16px; pointer-events: none; }
        .control-search input { width: 100%; padding-left: 36px !important; }
        
        .control-select { min-width: 180px; background-color: #f8fafc; }
        .control-badge { background: #1e293b; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; }
    </style>

    <div class="dashboard-wrapper">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <img src="./logo.png" alt="Waltz" style="border-radius:4px; max-height: 40px; cursor: pointer;" onclick="mostrarSubPaginaDash('dash')" title="Ir para o Início"> 
                <div class="btn-toggle-menu" onclick="toggleSidebar()"><i data-lucide="chevron-left"></i></div>
            </div>
            <ul class="nav-links">
                <li><div id="nav-dash" class="nav-link" onclick="mostrarSubPaginaDash('dash')"><i data-lucide="layout-dashboard"></i> <span class="nav-text">Dashboard</span></div></li>
                <li><div id="nav-tiny" class="nav-link" onclick="mostrarSubPaginaDash('tiny')"><i data-lucide="users"></i> <span class="nav-text">Clientes</span></div></li>
                <li><div id="nav-nuvem" class="nav-link" onclick="mostrarSubPaginaDash('nuvem')"><i data-lucide="shopping-cart"></i> <span class="nav-text">Pedidos</span></div></li>
                <li><div class="nav-link"><i data-lucide="truck"></i> <span class="nav-text">Entregas</span></div></li>
                <li><div class="nav-link"><i data-lucide="mail"></i> <span class="nav-text">E-mail</span></div></li>
                <li><div class="nav-link"><i data-lucide="message-circle"></i> <span class="nav-text">WhatsApp</span></div></li>
                <li><div id="nav-rfm" class="nav-link" onclick="mostrarSubPaginaDash('rfm')"><i data-lucide="bar-chart-2"></i> <span class="nav-text">Matriz RFM</span></div></li>
                <li><div id="nav-cep" class="nav-link" onclick="mostrarSubPaginaDash('cep')"><i data-lucide="map"></i> <span class="nav-text">Regiões Logísticas</span></div></li>
            </ul>
            <div class="sidebar-footer">
                <div class="nav-link" id="nav-config" onclick="mostrarSubPaginaDash('config')"><i data-lucide="settings"></i> <span class="nav-text">Configurações</span></div>
                <div class="nav-link" id="btn-logout"><i data-lucide="log-out"></i> <span class="nav-text">Sair</span></div>
            </div>
        </aside>

        <main class="main-content">
            <header class="topbar">
                <div class="page-title-area">
                    <h1 id="dash-page-title">Dashboard</h1>
                    <p id="dash-page-subtitle">Visão geral do seu e-commerce</p>
                </div>
                <div id="dynamic-top-actions" class="table-top-actions"></div>
            </header>

            <div class="page-content-wrapper" id="dashboard-content-area">
                
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

                    <div class="card-table">
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
                    </div>
                </div>

                <div id="sub-nuvem" class="sub-pagina" style="display: none;">
                    
                    <div class="control-bar">
                        <div class="control-filters">
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
                    </div>

                </div>
        </main>
    </div>`;
}