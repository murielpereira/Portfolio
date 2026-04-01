export function getAbaWhatsapp() {
    return `
    <div id="sub-whatsapp" class="sub-pagina" style="display: none;">
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background: white;">
            <label style="display: flex; align-items: center; cursor: pointer; font-weight: bold;">
                <input type="checkbox" id="cfg-whatsapp-ativo" style="margin-right: 10px; width: 20px; height: 20px;">
                Ativar Envio Automático de Mensagens no WhatsApp
            </label>
            <p style="margin-top: 5px; font-size: 12px; color: #666;">Se desmarcado, nenhuma mensagem será enviada aos clientes.</p>
        </div>
        <div class="card-table" style="padding: 30px;">
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <div style="width: 50px; height: 50px; background: #25D366; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="message-circle" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h2 style="font-size: 18px; color: var(--text-main); margin-bottom: 4px;">Templates do WhatsApp</h2>
                        <p style="font-size: 13px; color: var(--text-muted);">Personalize as mensagens disparadas em cada etapa.</p>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 25px; font-size: 13px; color: var(--text-muted);">
                    <strong>Variáveis:</strong> <span class="var-tag">{nome}</span>, <span class="var-tag">{pedido}</span>, <span class="var-tag">{rastreio}</span>, <span class="var-tag">{link_rastreio}</span>.
                </div>
                <form id="form-config-msg" onsubmit="salvarConfiguracoes(event)">
                    <div class="detail-group"><label>1. Pedido Aprovado</label><textarea id="msg-aprovado" class="textarea-modern">Olá {nome}! Seu pedido #{pedido} foi aprovado com sucesso! 🐶💙</textarea></div>
                    <div class="detail-group"><label>2. Em Fabricação</label><textarea id="msg-fabricacao" class="textarea-modern">Boas notícias, {nome}! O pedido #{pedido} entrou em produção.</textarea></div>
                    <div class="detail-group"><label>3. Código de Rastreio</label><textarea id="msg-rastreio" class="textarea-modern">{nome}, sua encomenda foi despachada! 🚚 Rastreio: {rastreio}. Link: {link_rastreio}</textarea></div>
                    <div class="detail-group"><label>4. Rota de Entrega</label><textarea id="msg-rota" class="textarea-modern">Atenção, {nome}! O carteiro saiu para entrega. O pedido #{pedido} chega hoje! 📦✨</textarea></div>
                    <div class="detail-group" style="margin-bottom: 30px;"><label>5. Feedback</label><textarea id="msg-feedback" class="textarea-modern">Olá {nome}, seu pedido chegou! O que achou dos produtos? 🥰</textarea></div>
                    <div style="text-align: right; border-top: 1px solid var(--border-color); padding-top: 20px;">
                        <button type="submit" class="btn-salvar"><i data-lucide="save"></i> Salvar Textos</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}