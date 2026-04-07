export function getAbaWhatsapp() {
    function gerarBloco(id, titulo, placeholder) {
        return `
        <div class="detail-group" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label style="display: flex; align-items: center; gap: 8px; font-weight: bold; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" id="cfg-ativo-${id}" style="width: 16px; height: 16px;"> ${titulo}
                </label>
                <button type="button" id="btn-testar-${id}" onclick="testarMensagemWpp('${id}')" class="btn-salvar" style="background: white; color: #475569; border: 1px solid #cbd5e1; padding: 4px 10px; font-size: 12px; min-width: auto; transition: 0.3s;"><i data-lucide="play" style="width: 14px; height: 14px;"></i> Testar</button>
            </div>
            <textarea id="msg-${id}" class="textarea-modern">${placeholder}</textarea>
        </div>`;
    }

    return `
    <div id="sub-whatsapp" class="sub-pagina" style="display: none;">
        <div class="card-table" style="padding: 30px;">
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <div style="width: 50px; height: 50px; background: #25D366; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i data-lucide="message-circle" style="width: 24px; height: 24px;"></i></div>
                    <div><h2 style="font-size: 18px; color: var(--text-main); margin-bottom: 4px;">Templates do WhatsApp</h2><p style="font-size: 13px; color: var(--text-muted);">Personalize e ative as mensagens que deseja disparar em cada etapa.</p></div>
                </div>
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 25px; font-size: 13px; color: #1e3a8a;">
                    <strong>Variáveis Dinâmicas:</strong> <span class="var-tag" style="background:white;">{nome}</span>, <span class="var-tag" style="background:white;">{pedido}</span>, <span class="var-tag" style="background:white;">{rastreio}</span>, <span class="var-tag" style="background:white;">{link_rastreio}</span>, <span class="var-tag" style="background:white;">{produtos}</span>.
                </div>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 25px;">
                    <h3 style="font-size: 14px; margin-bottom: 10px; color: var(--text-main);"><i data-lucide="clock" style="width:16px; margin-bottom:-3px;"></i> Horário de Envio (Mensagens Normais)</h3>
                    <div style="display:flex; gap: 15px; align-items:center; margin-bottom: 10px;">
                        <div><label style="font-size:12px; color:var(--text-muted);">Início</label><br><input type="time" id="cfg-hora-inicio" class="input-modern" style="width:120px;"></div>
                        <div><label style="font-size:12px; color:var(--text-muted);">Fim</label><br><input type="time" id="cfg-hora-fim" class="input-modern" style="width:120px;"></div>
                    </div>
                    <label style="font-size:12px; color:var(--text-muted);">Dias de Envio Permitidos</label>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
                        <label style="font-size:13px;"><input type="checkbox" class="cfg-dias" value="1"> Seg</label>
                        <label style="font-size:13px;"><input type="checkbox" class="cfg-dias" value="2"> Ter</label>
                        <label style="font-size:13px;"><input type="checkbox" class="cfg-dias" value="3"> Qua</label>
                        <label style="font-size:13px;"><input type="checkbox" class="cfg-dias" value="4"> Qui</label>
                        <label style="font-size:13px;"><input type="checkbox" class="cfg-dias" value="5"> Sex</label>
                        <label style="font-size:13px;"><input type="checkbox" class="cfg-dias" value="6"> Sáb</label>
                        <label style="font-size:13px;"><input type="checkbox" class="cfg-dias" value="0"> Dom</label>
                    </div>
                </div>
                <form id="form-config-msg" onsubmit="salvarConfiguracoes(event)">
                    ${gerarBloco('aprovado', '1. Pedido Aprovado', 'Olá {nome}! Seu pedido #{pedido} foi aprovado com sucesso! 🐶💙')}
                    ${gerarBloco('fabricacao', '2. Em Fabricação', 'Boas notícias, {nome}! O pedido #{pedido} entrou em produção.')}
                    ${gerarBloco('rastreio', '3. Código de Rastreio', '{nome}, sua encomenda foi despachada! 🚚 Rastreio: {rastreio}. Link: {link_rastreio}')}
                    ${gerarBloco('rota', '4. Rota de Entrega', 'Atenção, {nome}! O carteiro saiu para entrega. O pedido #{pedido} chega hoje! 📦✨')}
                    ${gerarBloco('feedback', '5. Feedback', 'Olá {nome}, seu pedido chegou! O que achou dos produtos? 🥰')}
                    
                    <div style="text-align: right; border-top: 1px solid var(--border-color); padding-top: 20px;">
                        <button type="submit" class="btn-salvar"><i data-lucide="save"></i> Salvar Textos e Regras</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}