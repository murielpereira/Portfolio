export function getAbaTrocas() {
    return `
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); z-index: 1000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-overlay.active { display: flex; }
        .modal-content { background: white; width: 100%; max-width: 600px; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; max-height: 95vh; overflow-y: auto; }
        .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    </style>

    <div id="sub-trocas" class="sub-pagina" style="display: none;">
        
        <div class="control-bar" style="flex-wrap: nowrap; justify-content: space-between;">
            <div>
                <h2 style="font-size: 18px; color: var(--text-main); margin-bottom: 4px;">Logística Reversa (Trocas e Devoluções)</h2>
                <p style="font-size: 13px; color: var(--text-muted);">Mapeamento de defeitos, extravios e custos de frete.</p>
            </div>
            <button onclick="abrirModalTroca()" class="btn-salvar"><i data-lucide="plus" style="width:18px; height:18px;"></i> Registrar Ocorrência</button>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;"><i data-lucide="refresh-ccw"></i></div>
                <div class="kpi-info"><h3>Total de Trocas</h3><div class="value" id="kpi-trocas-qtd">-</div><span class="trend" style="color:var(--text-muted)">Registros no sistema</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#fef2f2; color:#ef4444;"><i data-lucide="trending-down"></i></div>
                <div class="kpi-info"><h3>Custo de Frete (Âme)</h3><div class="value" id="kpi-trocas-custo">-</div><span class="trend negative">Prejuízo assumido pela loja</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#fffbeb; color:#f59e0b;"><i data-lucide="alert-triangle"></i></div>
                <div class="kpi-info"><h3>Produto + Problemático</h3><div class="value" style="font-size:16px; margin-top:5px; line-height:1.2;" id="kpi-trocas-produto">-</div></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#fce7f3; color:#a855f7;"><i data-lucide="package-x"></i></div>
                <div class="kpi-info"><h3>Extravios (Pendentes)</h3><div class="value" id="kpi-trocas-extravio">-</div><span class="trend negative">Aguardando ressarcimento</span></div>
            </div>
        </div>

        <section class="card" style="padding: 0; overflow: hidden;">
            <div class="tabela-responsiva">
                <table class="tabela-dados">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Ocorrência / Produto</th>
                            <th>Motivo</th>
                            <th>Custo/Frete</th>
                            <th>Status Financeiro</th>
                        </tr>
                    </thead>
                    <tbody id="corpo-tabela-trocas"><tr><td colspan="7" style="text-align: center; padding: 30px;">Carregando dados...</td></tr></tbody>
                </table>
            </div>
        </section>

        <div id="modal-troca" class="modal-overlay">
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:15px;">
                    <h2 style="font-size: 18px; color: var(--text-main);">Nova Ocorrência Logística</h2>
                    <button onclick="fecharModalTroca()" style="background:none; border:none; cursor:pointer; color:var(--text-muted);"><i data-lucide="x"></i></button>
                </div>
                
                <form id="form-nova-troca" onsubmit="salvarNovaTroca(event)">
                    
                    <div class="detail-group">
                        <label>1. Buscar Pedido</label>
                        <div style="display:flex; gap:10px;">
                            <input type="number" id="tr-pedido" class="input-modern" placeholder="Nº do Pedido Nuvemshop (Ex: 10259)" required style="flex:1;">
                            <button type="button" class="btn-salvar" style="background:#cbd5e1; color:#0f172a;" onclick="preencherDadosPedidoTroca()"><i data-lucide="search" style="width:16px;"></i> Buscar</button>
                        </div>
                        <p id="tr-aviso-pedido" style="font-size:12px; color:#ef4444; margin-top:5px; display:none;">Pedido não encontrado. Os produtos não poderão ser listados.</p>
                    </div>

                    <div class="grid-form" style="background:#f8fafc; padding:15px; border-radius:8px; border:1px dashed var(--border-color);">
                        <div class="detail-group" style="margin:0;"><label>Cliente Automático</label><input type="text" id="tr-cliente" class="input-modern" readonly style="background:#e2e8f0;"></div>
                        <div class="detail-group" style="margin:0;"><label>Estado Automático</label><input type="text" id="tr-estado" class="input-modern" readonly style="background:#e2e8f0;"></div>
                    </div>

                    <div class="grid-form">
                        <div class="detail-group">
                            <label>Tipo de Ocorrência</label>
                            <select id="tr-tipo" class="input-modern control-select" onchange="toggleCamposExtravio()" required>
                                <option value="Troca/Devolução">Troca / Devolução</option>
                                <option value="Extravio">Extravio (Perda pela Transportadora)</option>
                            </select>
                        </div>
                        <div class="detail-group">
                            <label>Qtd. de Peças</label>
                            <input type="number" id="tr-qtd" class="input-modern" value="1" min="1" required>
                        </div>
                    </div>

                    <div class="detail-group">
                        <label>Produtos Envolvidos (Selecione um ou mais)</label>
                        <div id="tr-modelos-container" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; max-height: 150px; overflow-y: auto; background: white;">
                            <div style="color: var(--text-muted); font-size: 13px;">Busque um pedido primeiro para listar os produtos...</div>
                        </div>
                        <input type="hidden" id="tr-modelo" required>
                    </div>

                    <div id="box-extravio" style="display:none; background:#fef2f2; padding:15px; border-radius:8px; border:1px solid #fca5a5; margin-bottom:15px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #b91c1c; font-weight: bold; font-size: 13px;">
                            <i data-lucide="alert-circle" style="width: 16px;"></i> Controle de Reembolso da Transportadora
                        </div>
                        <div class="grid-form" style="margin-bottom:0;">
                            <div class="detail-group" style="margin:0;">
                                <label style="color:#991b1b;">Já foi ressarcido?</label>
                                <select id="tr-ressarcido" class="input-modern control-select" style="border-color:#fca5a5;">
                                    <option value="Nao">Não (Pendente)</option>
                                    <option value="Sim">Sim (Já pagaram)</option>
                                </select>
                            </div>
                            <div class="detail-group" style="margin:0;">
                                <label style="color:#991b1b;">Valor Ressarcido (R$)</label>
                                <input type="number" id="tr-valor-ressarcido" class="input-modern" step="0.01" placeholder="Ex: 150.00" style="border-color:#fca5a5;">
                            </div>
                        </div>
                    </div>

                    <div class="grid-form">
                        <div class="detail-group"><label>Custo das Peças (R$)</label><input type="number" id="tr-valor" class="input-modern" step="0.01" placeholder="Ex: 74.75" required></div>
                        <div class="detail-group"><label>Valor do Novo Frete (R$)</label><input type="number" id="tr-frete" class="input-modern" step="0.01" placeholder="Ex: 12.00"></div>
                    </div>

                    <div class="grid-form">
                        <div class="detail-group">
                            <label>O Frete será Pago Por</label>
                            <select id="tr-pagador" class="input-modern control-select" required>
                                <option value="Âme">Âme</option>
                                <option value="Cliente">Cliente</option>
                                <option value="Transportadora">Transportadora</option>
                            </select>
                        </div>
                        <div class="detail-group">
                            <label>Canal de Atendimento</label>
                            <select id="tr-canal" class="input-modern control-select" required>
                                <option value="Cliente Chamou">Cliente Chamou</option>
                                <option value="Feedback">Feedback</option>
                                <option value="Rastreio (Automático)">Acompanhamento de Rastreio</option>
                            </select>
                        </div>
                    </div>

                    <div class="detail-group">
                        <label>Motivo detalhado / Observação</label>
                        <input type="text" id="tr-motivo" class="input-modern" placeholder="Ex: DDD errado, caixa roubada no fluxo..." required>
                    </div>

                    <div style="text-align: right; margin-top: 25px;">
                        <button type="submit" class="btn-salvar" style="width:100%;"><i data-lucide="check-circle" style="width:18px;"></i> Salvar Registro</button>
                    </div>
                </form>
            </div>
        </div>

    </div>`;
}