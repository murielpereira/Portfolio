export function getAbaConfig() {
    return `
    <div id="sub-config" class="sub-pagina" style="display: none;">
        <div class="card-table" style="padding: 30px;">
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <div style="width: 50px; height: 50px; background: #fffbeb; color: #f59e0b; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="award" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 18px; color: var(--text-main); margin-bottom: 4px;">Regras de Classificação VIP</h3>
                        <p style="font-size: 13px; color: var(--text-muted);">Defina o valor mínimo de Gasto Total para cada categoria.</p>
                    </div>
                </div>
                <form id="form-config-vip" onsubmit="salvarConfiguracoes(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div class="detail-group"><label><span class="badge badge-diamante">Diamante</span> Mínimo (R$)</label><input type="number" id="cfg-diamante" class="input-modern" value="6000"></div>
                        <div class="detail-group"><label><span class="badge badge-ouro">Ouro</span> Mínimo (R$)</label><input type="number" id="cfg-ouro" class="input-modern" value="3000"></div>
                        <div class="detail-group"><label><span class="badge badge-prata">Prata</span> Mínimo (R$)</label><input type="number" id="cfg-prata" class="input-modern" value="1000"></div>
                    </div>
                    <div style="text-align: right; border-top: 1px solid var(--border-color); padding-top: 20px;">
                        <button type="submit" class="btn-salvar"><i data-lucide="save"></i> Salvar Regras VIP</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}