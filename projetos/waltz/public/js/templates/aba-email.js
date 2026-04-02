export function getAbaEmail() {
    return `
    <div id="sub-email" class="sub-pagina" style="display: none;">
        
        <div class="control-bar" style="flex-wrap: nowrap; justify-content: space-between;">
            <div>
                <h2 style="font-size: 18px; color: var(--text-main); margin-bottom: 4px;">E-mail Marketing</h2>
                <p style="font-size: 13px; color: var(--text-muted);">Acompanhe o desempenho das suas campanhas e automações.</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-salvar" style="background: white; color: var(--text-main); border: 1px solid var(--border-color);"><i data-lucide="bar-chart-2" style="width:16px; height:16px;"></i> Relatório Completo</button>
                <button class="btn-salvar"><i data-lucide="plus" style="width:16px; height:16px;"></i> Criar Campanha</button>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#ecfdf5; color:#10b981;"><i data-lucide="dollar-sign"></i></div>
                <div class="kpi-info">
                    <h3>Receita Assistida (30d)</h3>
                    <div class="value">R$ 102.674,50</div>
                    <span class="trend positive">↑ 36% <span style="color: var(--text-muted); font-weight: normal;">vs mês anterior</span></span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;"><i data-lucide="send"></i></div>
                <div class="kpi-info">
                    <h3>E-mails Enviados</h3>
                    <div class="value">64.221</div>
                    <span class="trend positive">Taxa de entrega: 99.8%</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#fef2f2; color:#ef4444;"><i data-lucide="mail-open"></i></div>
                <div class="kpi-info">
                    <h3>Taxa de Abertura</h3>
                    <div class="value">68%</div>
                    <span class="trend positive">↑ 9.0% <span style="color: var(--text-muted); font-weight: normal;">vs mês anterior</span></span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:#fffbeb; color:#f59e0b;"><i data-lucide="mouse-pointer-click"></i></div>
                <div class="kpi-info">
                    <h3>Taxa de Cliques (CTR)</h3>
                    <div class="value">1,1%</div>
                    <span class="trend negative">↓ 3.0% <span style="color: var(--text-muted); font-weight: normal;">vs mês anterior</span></span>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
            
            <section class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 16px; color: var(--text-main);">Automações Ativas</h3>
                    <span class="badge badge-ouro" style="font-size: 10px;">Rodando em 2º plano</span>
                </div>
                <div class="tabela-responsiva" style="height: auto; max-height: 300px;">
                    <table class="tabela-dados">
                        <thead>
                            <tr>
                                <th>Nome da Automação</th>
                                <th>Gatilho</th>
                                <th style="text-align: center;">Iniciados</th>
                                <th style="text-align: center;">Completos</th>
                                <th style="text-align: right;">Vendas Geradas</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight: 500; color: var(--primary);">Carrinho abandonado com venda cruzada</td>
                                <td>🛒 Abandono de Carrinho</td>
                                <td style="text-align: center;">1.514</td>
                                <td style="text-align: center;">627</td>
                                <td style="text-align: right; font-weight: bold;">R$ 24.128,00 <br><span style="font-size:11px; color:var(--text-muted); font-weight:normal;">65 vendas</span></td>
                                <td><span class="badge badge-entregue">Ativo</span></td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; color: var(--primary);">Agradecimento pela primeira compra</td>
                                <td>🛍️ Compra Finalizada</td>
                                <td style="text-align: center;">1.113</td>
                                <td style="text-align: center;">803</td>
                                <td style="text-align: right; font-weight: bold;">R$ 3.755,00 <br><span style="font-size:11px; color:var(--text-muted); font-weight:normal;">13 vendas</span></td>
                                <td><span class="badge badge-entregue">Ativo</span></td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; color: var(--primary);">Remarketing de visita</td>
                                <td>👁️ Visita na Loja</td>
                                <td style="text-align: center;">1.599</td>
                                <td style="text-align: center;">1.099</td>
                                <td style="text-align: right; font-weight: bold;">R$ 16.490,00 <br><span style="font-size:11px; color:var(--text-muted); font-weight:normal;">39 vendas</span></td>
                                <td><span class="badge badge-entregue">Ativo</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; color: var(--text-main); margin-bottom: 15px;">Últimas Campanhas Enviadas</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
                    
                    <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; transition: transform 0.2s; cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span class="badge" style="background: #eff6ff; color: #3b82f6;">Inteligente</span>
                            <span class="badge badge-entregue">Enviada</span>
                        </div>
                        <h4 style="font-size: 14px; color: var(--text-main); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Semana do Consumidor</h4>
                        <p style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px;"><i data-lucide="calendar" style="width:12px; height:12px;"></i> 17 Mar, 15:00</p>
                        <div style="margin-top: 15px; height: 180px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; flex-direction: column; gap: 5px;">
                            <i data-lucide="image" style="width:30px; height:30px;"></i>
                            <span style="font-size: 11px;">Pré-visualização</span>
                        </div>
                    </div>

                    <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; transition: transform 0.2s; cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span class="badge" style="background: #f1f5f9; color: #64748b;">Simples</span>
                            <span class="badge badge-entregue">Enviada</span>
                        </div>
                        <h4 style="font-size: 14px; color: var(--text-main); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Convite Live Shop</h4>
                        <p style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px;"><i data-lucide="calendar" style="width:12px; height:12px;"></i> 12 Mar, 11:27</p>
                        <div style="margin-top: 15px; height: 180px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; flex-direction: column; gap: 5px;">
                            <i data-lucide="image" style="width:30px; height:30px;"></i>
                            <span style="font-size: 11px;">Pré-visualização</span>
                        </div>
                    </div>

                    <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; transition: transform 0.2s; cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span class="badge" style="background: #eff6ff; color: #3b82f6;">Inteligente</span>
                            <span class="badge badge-ouro">Programada</span>
                        </div>
                        <h4 style="font-size: 14px; color: var(--text-main); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Lançamento Coleção Outono</h4>
                        <p style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px;"><i data-lucide="calendar" style="width:12px; height:12px;"></i> 05 Abr, 09:00</p>
                        <div style="margin-top: 15px; height: 180px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; flex-direction: column; gap: 5px;">
                            <i data-lucide="image" style="width:30px; height:30px;"></i>
                            <span style="font-size: 11px;">Pré-visualização</span>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    </div>`;
}