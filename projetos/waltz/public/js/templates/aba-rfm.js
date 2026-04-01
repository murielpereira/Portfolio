export function getAbaRfm() {
    return `
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
    </div>`;
}