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
                
                <div id="sub-config" class="sub-pagina" style="display: none;">
                    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px;">
                        <label style="display: flex; align-items: center; cursor: pointer; font-weight: bold;">
                            <input type="checkbox" id="cfg-whatsapp-ativo" style="margin-right: 10px; width: 20px; height: 20px;">
                            Ativar Envio Automático de Mensagens no WhatsApp
                        </label>
                        <p style="margin-top: 5px; font-size: 12px; color: #666;">Se desmarcado, nenhuma mensagem será enviada aos clientes, mesmo que os pedidos sejam atualizados.</p>
                    </div>
                    <div class="card-table" style="padding: 30px; height: calc(100vh - 220px); overflow-y: auto;">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                                <div style="width: 50px; height: 50px; background: #eff6ff; color: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="message-circle" style="width: 24px; height: 24px;"></i>
                                </div>
                                <div>
                                    <h2 style="font-size: 18px; color: var(--text-main); margin-bottom: 4px;">Templates do WhatsApp</h2>
                                    <p style="font-size: 13px; color: var(--text-muted);">Personalize as mensagens disparadas em cada etapa do funil logístico.</p>
                                </div>
                            </div>
                            
                            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 25px; font-size: 13px; color: var(--text-muted);">
                                <strong>Variáveis Disponíveis:</strong> Use <span class="var-tag">{nome}</span> para o cliente, <span class="var-tag">{pedido}</span> para o número, <span class="var-tag">{rastreio}</span> para o código e <span class="var-tag">{link_rastreio}</span> para a URL.
                            </div>

                            <form id="form-config-msg" onsubmit="salvarConfiguracoes(event)">
                                <div class="detail-group">
                                    <label style="font-size: 13px; color: var(--primary);">1. Pedido Aprovado</label>
                                    <textarea id="msg-aprovado" class="textarea-modern">Olá {nome}! Seu pedido #{pedido} foi aprovado com sucesso e já estamos preparando tudo com muito carinho. 🐶💙</textarea>
                                </div>
                                <div class="detail-group">
                                    <label style="font-size: 13px; color: var(--primary);">2. Em Fabricação</label>
                                    <textarea id="msg-fabricacao" class="textarea-modern">Boas notícias, {nome}! Os itens do seu pedido #{pedido} acabaram de entrar em produção. Em breve estarão prontos!</textarea>
                                </div>
                                <div class="detail-group">
                                    <label style="font-size: 13px; color: var(--primary);">3. Código de Rastreio</label>
                                    <textarea id="msg-rastreio" class="textarea-modern">{nome}, sua encomenda foi despachada! 🚚 Seu código de rastreio é {rastreio}. Acompanhe por aqui: {link_rastreio}</textarea>
                                </div>
                                <div class="detail-group">
                                    <label style="font-size: 13px; color: var(--primary);">4. Rota de Entrega</label>
                                    <textarea id="msg-rota" class="textarea-modern">Atenção, {nome}! O carteiro saiu para entrega. Fique de olho, o seu pedido #{pedido} chega hoje! 📦✨</textarea>
                                </div>
                                <div class="detail-group" style="margin-bottom: 30px;">
                                    <label style="font-size: 13px; color: var(--primary);">5. Feedback</label>
                                    <textarea id="msg-feedback" class="textarea-modern">Olá {nome}, vimos que seu pedido chegou! O que achou dos produtos? Seu feedback é muito importante para nós! 🥰</textarea>
                                </div>

                                <div style="margin-top: 40px; margin-bottom: 20px; padding-top: 30px; border-top: 1px solid var(--border-color);">
                                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                                        <div style="width: 40px; height: 40px; background: #fffbeb; color: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                            <i data-lucide="award" style="width: 20px; height: 20px;"></i>
                                        </div>
                                        <div>
                                            <h3 style="font-size: 16px; color: var(--text-main); margin-bottom: 4px;">Regras de Classificação VIP</h3>
                                            <p style="font-size: 12px; color: var(--text-muted);">Defina o valor mínimo de LTV (Gasto Total) para cada categoria.</p>
                                        </div>
                                    </div>
                                    
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                                        <div class="detail-group">
                                            <label style="font-size: 13px; color: #475569;"><span class="badge badge-diamante">Diamante</span> Mínimo (R$)</label>
                                            <input type="number" id="cfg-diamante" class="input-modern" value="6000">
                                        </div>
                                        <div class="detail-group">
                                            <label style="font-size: 13px; color: #475569;"><span class="badge badge-ouro">Ouro</span> Mínimo (R$)</label>
                                            <input type="number" id="cfg-ouro" class="input-modern" value="3000">
                                        </div>
                                        <div class="detail-group">
                                            <label style="font-size: 13px; color: #475569;"><span class="badge badge-prata">Prata</span> Mínimo (R$)</label>
                                            <input type="number" id="cfg-prata" class="input-modern" value="1000">
                                        </div>
                                    </div>
                                    <p style="font-size: 11px; color: var(--text-muted); margin-top: -10px; margin-bottom: 20px;">* Clientes com gasto abaixo do valor Prata serão classificados automaticamente como Bronze.</p>
                                </div>
                                
                                <div style="text-align: right; border-top: 1px solid var(--border-color); padding-top: 20px;">
                                    <button type="submit" class="btn-salvar"><i data-lucide="save" style="width:18px; height:18px;"></i> Salvar Textos</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

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
                </div>

                <div id="sub-tiny" class="sub-pagina" style="display: none;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <input type="text" id="filtro-texto" class="input-modern" placeholder="Nome ou CPF/CNPJ..." onkeyup="resetarEPaginacao()" style="width: 250px;">
                            
                            <select id="filtro-grupo" class="input-modern" onchange="resetarEPaginacao()" style="cursor: pointer; min-width: 160px;">
                                <option value="TODOS">Todos os Grupos</option>
                                <option value="SEM COMPRAS">Sem Compras</option>
                                <option value="PRIMEIRA COMPRA">1ª Compra</option>
                                <option value="BRONZE">Bronze</option>
                                <option value="PRATA">Prata</option>
                                <option value="OURO">Ouro</option>
                                <option value="DIAMANTE">Diamante</option>
                            </select>
                        </div>
                        
                        <span id="contador-cadastros" style="background: #1e293b; color: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            0 cadastro(s)
                        </span>
                    </div>

                    <div class="card-table">
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                            <thead>
                                    <tr>
                                        <th onclick="ordenarTabela(0)">Nome <span class="sort-icon" id="sort-icon-0">↑↓</span></th>
                                        <th onclick="ordenarTabela(1)">WhatsApp <span class="sort-icon" id="sort-icon-1">↑↓</span></th>
                                        <th onclick="ordenarTabela(2)">CPF/CNPJ <span class="sort-icon" id="sort-icon-2">↑↓</span></th>
                                        <th onclick="ordenarTabela(3)">Cidade <span class="sort-icon" id="sort-icon-3">↑↓</span></th>
                                        <th onclick="ordenarTabela(4)">UF <span class="sort-icon" id="sort-icon-4">↑↓</span></th>
                                        <th onclick="ordenarTabela(5)">Grupo <span class="sort-icon" id="sort-icon-5">↑↓</span></th> 
                                        <th onclick="ordenarTabela(6)">Pedidos <span class="sort-icon" id="sort-icon-6">↑↓</span></th>
                                        <th onclick="ordenarTabela(7)">Ticket Médio <span class="sort-icon" id="sort-icon-7">↑↓</span></th>
                                        <th onclick="ordenarTabela(8)">Entrega <span class="sort-icon" id="sort-icon-8">↑↓</span></th>
                                        <th onclick="ordenarTabela(9)">Valor Total <span class="sort-icon" id="sort-icon-9">↑↓</span></th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-clientes-body"><tr><td colspan="10" style="text-align:center; padding: 30px;">Carregando...</td></tr></tbody>
                            </table>
                        </div>
                        <div class="paginacao-controles" id="paginacao-ltv"></div>
                    </div>
                </div>

                <div id="sub-nuvem" class="sub-pagina" style="display: none;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <input type="text" id="busca-nuvem" class="input-modern" placeholder="Buscar pedido ou cliente..." onkeyup="resetarPaginacaoNuvem()" style="width: 250px;">
                            
                            <select id="filtro-status-nuvem" class="input-modern" onchange="resetarPaginacaoNuvem()" style="cursor: pointer; min-width: 150px;">
                                <option value="TODOS">Todos os Status</option>
                                <option value="Aberto">Aberto</option>
                                <option value="Enviado">Enviado</option>
                                <option value="Entregue">Entregue</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>

                            <select id="filtro-automacao-nuvem" class="input-modern" onchange="resetarPaginacaoNuvem()" style="cursor: pointer; min-width: 200px;">
                                <option value="TODOS">Todas as Automações</option>
                                <option value="Aguardando Automação...">Aguardando Automação...</option>
                                <option value="1. Pedido Aprovado">1. Pedido Aprovado</option>
                                <option value="2. Em Fabricação">2. Em Fabricação</option>
                                <option value="3. Rastreio Enviado">3. Rastreio Enviado</option>
                                <option value="4. Em Rota / Entregue">4. Em Rota / Entregue</option>
                                <option value="5. Feedback Concluído">5. Feedback Concluído</option>
                            </select>
                        </div>
                        
                        <span id="contador-nuvem" style="background: #1e293b; color: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            0 pedido(s)
                        </span>
                    </div>

                    <div class="card-table">
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
                    </div>
                </div>

                <div id="sub-rfm" class="sub-pagina" style="display: none;">
                    <div class="card-table" style="padding: 30px; text-align: center;">
                        <div style="width: 60px; height: 60px; background: #eff6ff; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i data-lucide="target" style="width: 30px; height: 30px;"></i>
                        </div>
                        <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 10px;">Matriz RFM Inteligente</h2>
                        <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 30px;">
                            A análise de <b>Recência</b> (tempo desde a última compra), <b>Frequência</b> (quantidade de compras) e <b>Monetário</b> (valor gasto) divide a sua base para ações de marketing precisas.
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; max-width: 800px; margin: 0 auto 30px;">
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="font-size: 24px; font-weight: bold; color: var(--primary);" id="rfm-r-avg">-</div>
                                <b>Recência Média</b> <br><span style="font-size:12px; color:var(--text-muted)">Dias desde a última compra</span>
                            </div>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="font-size: 24px; font-weight: bold; color: #10b981;" id="rfm-f-avg">-</div>
                                <b>Frequência Média</b> <br><span style="font-size:12px; color:var(--text-muted)">Total de pedidos por cliente</span>
                            </div>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;" id="rfm-m-avg">-</div>
                                <b>LTV Médio</b> <br><span style="font-size:12px; color:var(--text-muted)">Gasto total por cliente</span>
                            </div>
                        </div>
                        <div style="max-width: 800px; margin: 0 auto; text-align: left;" id="rfm-segmentos">
                            <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-diamante">Campeões</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Compraram recentemente, compram com frequência e gastam muito.</span></div>
                                <strong id="rfm-campeoes">0 clientes</strong>
                            </div>
                            <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-ouro">Fiéis</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Compram com frequência regular na sua loja.</span></div>
                                <strong id="rfm-fieis">0 clientes</strong>
                            </div>
                            <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-primeiracompra">Recentes</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Fizeram a primeira compra nos últimos 30 dias.</span></div>
                                <strong id="rfm-recentes">0 clientes</strong>
                            </div>
                            <div style="padding: 15px; display:flex; justify-content:space-between; align-items:center;">
                                <div><span class="badge badge-bronze">Em Risco</span> <span style="font-size:13px; color:var(--text-muted); margin-left:10px;">Compraram no passado, mas estão sumidos há muito tempo.</span></div>
                                <strong id="rfm-emrisco">0 clientes</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="sub-cep" class="sub-pagina" style="display: none;">
                    <section id="mapa_brasil_card" class="card" style="display:none; padding: 20px; margin-bottom: 20px; background:white; border-radius:12px; border:1px solid var(--border-color);">
                        <h2 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Visualização Geográfica (Heatmap de Entrega)</h2>
                        <div style="display: flex; justify-content: center; align-items: center; background: #f8fafc; border-radius: 8px; padding: 10px;"><div id="mapa_brasil_div" style="width: 100%; max-width: 650px; height: 350px;"></div></div>
                    </section>
                    <div class="card-table">
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                                <thead><tr><th>Estado (UF)</th><th>CEP Base</th><th>Média de Tempo de Entrega</th><th>Volume (Qtd de Pedidos)</th></tr></thead>
                                <tbody id="corpo-tabela-ceps"><tr><td colspan="4" style="text-align: center; padding: 30px;">Aguardando processamento...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div> <div class="drawer-overlay" id="drawer-overlay" onclick="fecharDetalhesPedido()"></div>
            <div class="drawer-panel" id="drawer-pedido">
                <div class="drawer-header">
                    <h2 id="drawer-titulo">Detalhes do Pedido</h2>
                    <button class="btn-close-drawer" onclick="fecharDetalhesPedido()"><i data-lucide="x"></i></button>
                </div>
                <div class="drawer-body" id="drawer-conteudo">
                    </div>
            </div>

        </main>
    </div>`;
}