export function getAbaRfm() {
    return `
    <style>
        .rfm-dashboard {
            display: grid;
            grid-template-areas: 
                "nao-perder nao-perder leais leais leais campeoes campeoes"
                "risco risco leais leais leais campeoes campeoes"
                "risco risco atencao atencao potenciais potenciais potenciais"
                "perdidos hibernando dormir dormir promissores novos novos";
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 100px;
            gap: 4px;
            border-radius: 8px;
            overflow: hidden;
            margin-top: 20px;
        }
        .rfm-box { padding: 15px; display: flex; flex-direction: column; justify-content: space-between; color: white; cursor: pointer; transition: 0.2s; }
        .rfm-box:hover { filter: brightness(1.15); transform: scale(0.99); }
        .rfm-title { font-weight: bold; font-size: 14px; display: flex; justify-content: space-between;}
        .rfm-count { font-size: 13px; opacity: 0.9; font-weight: 500; text-align: right;}
        
        /* Cores baseadas na imagem de referência */
        .r-naoperder { grid-area: nao-perder; background: #ef4444; }
        .r-leais { grid-area: leais; background: #0ea5e9; }
        .r-campeoes { grid-area: campeoes; background: #22c55e; }
        .r-risco { grid-area: risco; background: #f97316; }
        .r-atencao { grid-area: atencao; background: #eab308; }
        .r-potenciais { grid-area: potenciais; background: #84cc16; }
        .r-perdidos { grid-area: perdidos; background: #64748b; }
        .r-hibernando { grid-area: hibernando; background: #9ca3af; }
        .r-dormir { grid-area: dormir; background: #cbd5e1; color: #1e293b !important; }
        .r-promissores { grid-area: promissores; background: #8b5cf6; }
        .r-novos { grid-area: novos; background: #06b6d4; }
    </style>

    <div id="sub-rfm" class="sub-pagina" style="display: none;">
        
        <div class="card-table" style="padding: 30px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <div style="width: 50px; height: 50px; background: #fef2f2; color: #ef4444; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="heart" style="width: 24px; height: 24px; fill: currentColor;"></i>
                </div>
                <div>
                    <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 4px;">Matriz RFM</h2>
                    <p style="font-size: 14px; color: var(--text-muted);">Analise seus clientes por recência, frequência e gasto para obter insights de fidelização. <b>Clique nos blocos para ver a lista de clientes.</b></p>
                </div>
            </div>

            <div class="rfm-dashboard">
                <div class="rfm-box r-naoperder" onclick="abrirListaClientesRFM('Não Podemos Perder')">
                    <span class="rfm-title">Não Podemos Perder</span><span class="rfm-count" id="rfm-count-NãoPodemosPerder">Carregando...</span>
                </div>
                <div class="rfm-box r-leais" onclick="abrirListaClientesRFM('Clientes Leais')">
                    <span class="rfm-title">Clientes Leais</span><span class="rfm-count" id="rfm-count-ClientesLeais">Carregando...</span>
                </div>
                <div class="rfm-box r-campeoes" onclick="abrirListaClientesRFM('Campeões')">
                    <span class="rfm-title">Campeões</span><span class="rfm-count" id="rfm-count-Campeões">Carregando...</span>
                </div>
                <div class="rfm-box r-risco" onclick="abrirListaClientesRFM('Em Risco')">
                    <span class="rfm-title">Em Risco</span><span class="rfm-count" id="rfm-count-EmRisco">Carregando...</span>
                </div>
                <div class="rfm-box r-atencao" onclick="abrirListaClientesRFM('Precisam de Atenção')">
                    <span class="rfm-title">Precisam de Atenção</span><span class="rfm-count" id="rfm-count-PrecisamdeAtenção">Carregando...</span>
                </div>
                <div class="rfm-box r-potenciais" onclick="abrirListaClientesRFM('Potenciais Leais')">
                    <span class="rfm-title">Potenciais Leais</span><span class="rfm-count" id="rfm-count-PotenciaisLeais">Carregando...</span>
                </div>
                <div class="rfm-box r-perdidos" onclick="abrirListaClientesRFM('Perdidos')">
                    <span class="rfm-title">Perdidos</span><span class="rfm-count" id="rfm-count-Perdidos">Carregando...</span>
                </div>
                <div class="rfm-box r-hibernando" onclick="abrirListaClientesRFM('Hibernando')">
                    <span class="rfm-title">Hibernando</span><span class="rfm-count" id="rfm-count-Hibernando">Carregando...</span>
                </div>
                <div class="rfm-box r-dormir" onclick="abrirListaClientesRFM('Prestes a Dormir')">
                    <span class="rfm-title">Prestes a Dormir</span><span class="rfm-count" id="rfm-count-PrestesaDormir">Carregando...</span>
                </div>
                <div class="rfm-box r-promissores" onclick="abrirListaClientesRFM('Promissores')">
                    <span class="rfm-title">Promissores</span><span class="rfm-count" id="rfm-count-Promissores">Carregando...</span>
                </div>
                <div class="rfm-box r-novos" onclick="abrirListaClientesRFM('Novos Clientes')">
                    <span class="rfm-title">Novos Clientes</span><span class="rfm-count" id="rfm-count-NovosClientes">Carregando...</span>
                </div>
            </div>
        </div>

        <div id="rfm-detalhes-area" class="card-table" style="display: none; padding: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 id="rfm-detalhes-titulo" style="color: var(--text-main); font-size: 18px;">Selecione um segmento...</h3>
                <button onclick="exportarCSV_RFM()" class="btn-salvar" style="background: #10b981;"><i data-lucide="download" style="width: 18px; height: 18px;"></i> Exportar CSV</button>
            </div>
            <div class="tabela-responsiva" style="height: 400px; overflow-y: auto;">
                <table class="tabela-dados">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>WhatsApp</th>
                            <th>CPF/CNPJ</th>
                            <th>Qtd. Pedidos</th>
                            <th>LTV (Gasto)</th>
                            <th>Última Compra</th>
                        </tr>
                    </thead>
                    <tbody id="rfm-tabela-clientes-body">
                        </tbody>
                </table>
            </div>
        </div>

    </div>`;
}