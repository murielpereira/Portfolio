export function getAbaConfig() {
    return `
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
                        <button type="submit" class="btn-salvar"><i data-lucide="save" style="width:18px; height:18px;"></i> Salvar Configurações</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}