// ============================================================================
// MÓDULO 1: UTILITÁRIOS E FORMATAÇÕES GERAIS
// ============================================================================

function formatarDocumento(doc) {
    if (!doc) return '-';
    const num = doc.replace(/\D/g, '');
    if (num.length === 11) return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (num.length === 14) return num.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return doc;
}

function formatarWhatsAppClicavel(telefone) {
    if (!telefone) return '-';
    const num = telefone.replace(/\D/g, '');
    if (num.length < 10) return telefone;
    let ddd = num.substring(0, 2);
    let resto = num.substring(2);
    let link = `https://wa.me/55${num}`;
    let texto = `(${ddd}) ${resto.length === 9 ? resto.substring(0, 5) + '-' + resto.substring(5) : resto.substring(0, 4) + '-' + resto.substring(4)}`;
    return `<a href="${link}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">${texto}</a>`;
}

function toggleSenha() {
    const input = document.getElementById('senha');
    const icone = document.getElementById('icone-senha');
    if (input && icone) {
        if (input.type === 'password') {
            input.type = 'text';
            icone.innerText = 'visibility_off';
        } else {
            input.type = 'password';
            icone.innerText = 'visibility';
        }
    }
}

// ============================================================================
// MÓDULO 2: TEMPLATES HTML (Arquitetura SPA)
// ============================================================================

function getTemplateLogin() {
    return `
    <div class="login-wrapper">
        <div class="login-container">
            <h2>Acesso Restrito</h2>
            <form id="form-login">
                <div class="input-group" style="margin-bottom: 15px;">
                    <label for="usuario" style="display: block; margin-bottom: 5px; font-weight: bold; color: #475569;">Usuário</label>
                    <input type="text" id="usuario" name="usuario" class="input-padrao" required>
                </div>
                <div class="input-group" style="margin-bottom: 25px;">
                    <label for="senha" style="display: block; margin-bottom: 5px; font-weight: bold; color: #475569;">Senha</label>
                    <div class="senha-container" style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="senha" name="senha" class="input-padrao" style="padding-right: 40px;" required>
                        <button type="button" id="btn-mostrar-senha" title="Mostrar/Ocultar senha" style="position: absolute; right: 5px; background: transparent; border: none; color: #64748b; padding: 5px; display: flex; cursor: pointer;">
                            <span class="material-symbols-outlined" id="icone-senha">visibility</span>
                        </button>
                    </div>
                </div>
                <button type="submit" id="btn-login-submit" class="btn-azul" style="width: 100%; font-weight: bold; padding: 12px; font-size: 16px;">Entrar</button>
            </form>
        </div>
    </div>`;
}

function getTemplatePainel() {
    return `
    <div class="dashboard-wrapper">
        <aside class="sidebar">
            <div class="brand" style="margin-bottom: 40px; text-align: center;">
                <img src="../images/logo.jpg" alt="Waltz" style="max-width: 150px; height: auto; border-radius: 8px;">
            </div>
            <ul class="nav-links">
                <li>
                    <div id="nav-tiny" class="nav-link" onclick="mostrarSubPaginaDash('tiny')">
                        <span class="material-symbols-outlined">analytics</span>
                        Clientes
                    </div>
                </li>
                <li>
                    <div id="nav-nuvem" class="nav-link" onclick="mostrarSubPaginaDash('nuvem')">
                        <span class="material-symbols-outlined">shopping_cart</span>
                        Pedidos
                    </div>
                </li>
            </ul>
            <div class="user-menu-area" style="margin-top: auto; border-top: 1px solid #2d3748; padding-top: 20px;">
                <button id="btn-logout" class="btn-sair">
                    <span class="material-symbols-outlined">logout</span>
                    Sair do Sistema
                </button>
            </div>
        </aside>

        <main class="main-content">
            <header class="topbar">
                <h1 id="dash-page-title">Painel de Automação</h1>
                <div class="info-loja">Âme Acessórios Pet | Automação v1.005</div>
            </header>

            <div class="page-content-wrapper" id="dashboard-content-area">
                
                <!-- ABA TINY -->
                <div id="sub-tiny" class="sub-pagina" style="display: none;">
                    <section class="card">
                        <div class="card-header-actions" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div class="filtros-area" style="display: flex; gap: 20px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label style="font-weight: bold; color: #475569;">Buscar:</label>
                                    <input type="text" id="filtro-texto" class="input-padrao" placeholder="Nome ou CPF/CNPJ..." onkeyup="resetarEPaginacao()" style="width: 220px; padding: 8px;">
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label style="margin-left:15px; font-weight:bold; font-size:12px; color:#475569;">Grupo:</label>
                                    <select id="filtro-grupo" onchange="resetarEPaginacao()" style="padding:6px; border:1px solid #cbd5e1; border-radius:6px; outline:none; font-size:13px; margin-left:5px;">
                                        <option value="TODOS">Todos os Grupos</option>
                                        <option value="DIAMANTE">Diamante</option>
                                        <option value="OURO">Ouro</option>
                                        <option value="PRATA">Prata</option>
                                        <option value="BRONZE">Bronze</option>
                                        <option value="PRIMEIRA COMPRA">1ª Compra</option>
                                        <option value="SEM COMPRAS">Sem Compras</option>
                                    </select>
                                </div>
                                <span id="contador-cadastros" style="background: #e2e8f0; color: #334155; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold;">
                                    0 cadastros
                                </span>
                            </div>
                        </div>
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                               <thead>
                                    <tr>
                                        <th class="col-sort" onclick="ordenarTabela(0)">Nome <span id="sort-icon-0">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(1)">WhatsApp <span id="sort-icon-1">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(2)">CPF/CNPJ <span id="sort-icon-2">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(3)">Cidade <span id="sort-icon-3">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(4)">UF <span id="sort-icon-4">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(5)">Grupo <span id="sort-icon-5">↕️</span></th> 
                                        <th class="col-sort" onclick="ordenarTabela(6)">Pedidos <span id="sort-icon-6">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(7)">Ticket Médio <span id="sort-icon-7">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(8)">Entrega <span id="sort-icon-8">↕️</span></th>
                                        <th class="col-sort" onclick="ordenarTabela(9)">Valor Total <span id="sort-icon-9">↕️</span></th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-clientes-body">
                                    <tr><td colspan="8" style="text-align:center; padding: 30px;">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="paginacao-controles" id="paginacao-ltv"></div>
                    </section>
                </div>

                <!-- ABA NUVEMSHOP -->
                <div id="sub-nuvem" class="sub-pagina" style="display: none;">
                    <section class="card">
                        <div class="card-header-actions" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div class="filtros-area" style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label style="font-weight: bold; color: #475569;">Buscar:</label>
                                    <input type="text" id="busca-nuvem" class="input-padrao" placeholder="Pedido, Cliente..." onkeyup="resetarPaginacaoNuvem()" style="width: 200px; padding: 8px;">
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label style="font-weight: bold; color: #475569;">Status:</label>
                                    <select id="filtro-status-nuvem" class="input-padrao" onchange="resetarPaginacaoNuvem()" style="padding: 8px; cursor: pointer;">
                                        <option value="TODOS">Todos</option>
                                        <option value="Aberto">Aberto</option>
                                        <option value="Entregue">Entregue</option>
                                        <option value="Arquivado">Arquivado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label style="font-weight: bold; color: #475569;">Feedback:</label>
                                    <select id="filtro-feedback-nuvem" class="input-padrao" onchange="resetarPaginacaoNuvem()" style="padding: 8px; cursor: pointer;">
                                        <option value="TODOS">Todos</option>
                                        <option value="Enviado">Enviado</option>
                                        <option value="Não Enviado">Não Enviado</option>
                                    </select>
                                </div>
                                <span id="contador-nuvem" style="background: #e2e8f0; color: #334155; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold;">
                                    0 pedidos
                                </span>
                            </div>
                        </div>
                        <div class="tabela-responsiva">
                            <table class="tabela-dados">
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Pedido</th>
                                        <th>Cliente</th>
                                        <th>CPF</th>
                                        <th>Cidade</th>
                                        <th>UF</th>
                                        <th>Transportadora</th>
                                        <th>Rastreio</th>
                                        <th>Status</th>
                                        <th style="text-align:center;">Feedback</th>
                                    </tr>
                                </thead>
                                <tbody id="corpo-tabela-nuvem">
                                    <tr><td colspan="10" style="text-align: center; padding: 30px;">Carregando...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="paginacao-controles" id="paginacao-nuvem"></div>
                    </section>
                </div>

            </div>
        </main>
    </div>`;
}

// ============================================================================
// MÓDULO 3: AUTENTICAÇÃO E INICIALIZAÇÃO SPA
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarApp();
});

async function inicializarApp() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    try {
        const resposta = await fetch('/api/check-session');
        const dados = await resposta.json();

        if (dados.logado) {
            appDiv.innerHTML = getTemplatePainel();
            document.getElementById('btn-logout')?.addEventListener('click', realizarLogout);
            mostrarSubPaginaDash('tiny'); 
        } else {
            appDiv.innerHTML = getTemplateLogin();
            document.getElementById('form-login')?.addEventListener('submit', realizarLogin);
            document.getElementById('btn-mostrar-senha')?.addEventListener('click', toggleSenha);
        }
    } catch (erro) {
        appDiv.innerHTML = '<p style="text-align:center; padding:50px; font-family:sans-serif;">Erro de conexão. Atualize a página.</p>';
    }
}

async function realizarLogin(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuario')?.value;
    const senha = document.getElementById('senha')?.value;
    const btn = document.getElementById('btn-login-submit');
    
    if (btn) { btn.innerText = 'Acessando...'; btn.disabled = true; }

    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            window.location.reload(); 
        } else {
            alert('Usuário ou senha incorretos!');
        }
    } catch (erro) {
        alert('Erro ao conectar com o servidor.');
    } finally {
        if (btn) { btn.innerText = 'Entrar'; btn.disabled = false; }
    }
}

async function realizarLogout() {
    try {
        await fetch('/api/logout');
        window.location.reload();
    } catch (erro) {
        console.error("Erro ao sair:", erro);
    }
}

async function mostrarSubPaginaDash(idAlvo) {
    document.querySelectorAll('.sub-pagina').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    const painelAlvo = document.getElementById(`sub-${idAlvo}`);
    const menuAlvo = document.getElementById(`nav-${idAlvo}`);
    
    if (painelAlvo) painelAlvo.style.display = 'block';
    if (menuAlvo) menuAlvo.classList.add('active');

    if (idAlvo === 'tiny') {
        document.getElementById('dash-page-title').innerText = "Clientes";
        await carregarClientesTinyDB();
    } else if (idAlvo === 'nuvem') {
        document.getElementById('dash-page-title').innerText = "Pedidos";
        await carregarPedidosNuvemDB();
    }
}

// ============================================================================
// MÓDULO 4: NUVEMSHOP E AUTOMAÇÃO DE WHATSAPP
// ============================================================================

let todosOsPedidosNuvem = [];
let paginaAtualNuvem = 1;
const itensPorPaginaNuvem = 50;

async function carregarPedidosNuvemDB() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 30px;">Carregando pedidos do Banco de Dados...</td></tr>';
    try {
        const resposta = await fetch('/api/pedidos');
        if (!resposta.ok) throw new Error("Falha ao carregar banco de dados.");
        todosOsPedidosNuvem = await resposta.json();
        resetarPaginacaoNuvem();
    } catch (e) { 
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;"><b>Erro:</b> ${e.message}</td></tr>`;
    }
}

// ==========================================
// FUNÇÃO: ENVIAR FEEDBACK VIA WHATSAPP (Corrigida)
// ==========================================
async function enviarFeedbackWpp(idPedido, telefone, nome, numPedido, produtosCodificados) {
    // 1. Validação do telefone
    if (!telefone || telefone === 'undefined' || telefone.trim() === '') {
        alert("⚠️ Este pedido não possui telefone cadastrado no banco de dados.");
        return;
    }

    const numeroApenasDigitos = telefone.replace(/\D/g, '');
    const primeiroNome = nome.split(' ')[0]; 
    const produtos = decodeURIComponent(produtosCodificados); 
    
    // 2. Montagem dos produtos e da mensagem
    let trechoProdutos = '';
    if (produtos && produtos.trim() !== '' && produtos !== 'undefined') {
        trechoProdutos = `\n\n📦 *Itens do pedido:* ${produtos}`;
    }

    const mensagem = `Oii ${primeiroNome}, tudo bem? Aqui é a Bia, da Âme Acessórios Pet.\n\nEstou entrando em contato pra saber se deu tudo certo com o seu pedido #${numPedido}.${trechoProdutos}\n\nVocê gostou do produto? Serviu direitinho? Teve algum problema ou dificuldade desde o momento da compra até a entrega?😀\n\nEsperamos sempre esse prazo para saber seu feedback, pois é o tempo que seu pet já usou e se adaptou com as nossas peças, e queremos sua opinião sincera, para que possamos sempre melhorar 🥰\n\nFico no aguardo da sua resposta.\n☺️☺️`;
    
    // 3. Abre a aba do WhatsApp Web para você dar o clique final
    const linkZap = `https://wa.me/55${numeroApenasDigitos}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkZap, '_blank');

    // 4. Atualiza o banco de dados de forma silenciosa
    try {
        await fetch('/api/pedidos/marcar-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_pedido: idPedido })
        });
        
        // CORREÇÃO DA PAGINAÇÃO: 
        // Em vez de recarregar tudo, procuramos o pedido na lista atual e atualizamos apenas ele!
        const pedidoIndex = todosOsPedidosNuvem.findIndex(p => p.id_pedido === idPedido);
        if (pedidoIndex !== -1) {
            todosOsPedidosNuvem[pedidoIndex].status_feedback = 'Enviado';
            renderizarPaginaNuvem(); // Redesenha a tabela mantendo você na mesma página
        }
        
    } catch (erro) {
        console.error("Falha ao marcar como enviado", erro);
    }
}

function renderizarPaginaNuvem() {
    const tbody = document.getElementById('corpo-tabela-nuvem');
    if(!tbody) return;
    
    const termoBusca = (document.getElementById("busca-nuvem")?.value || "").toLowerCase();
    const filtroStatus = document.getElementById("filtro-status-nuvem")?.value || "TODOS";
    const filtroFeedback = document.getElementById("filtro-feedback-nuvem")?.value || "TODOS";
    
    let dadosFiltrados = todosOsPedidosNuvem.filter(p => {
        const numPedido = (p.numero_pedido || "").toLowerCase();
        const nomeCliente = (p.nome_cliente || "").toLowerCase();
        const cpfCliente = (p.cpf_cliente || "").replace(/\D/g, ''); 
        const buscaLimpa = termoBusca.replace(/\D/g, ''); 
        
        const passaBusca = termoBusca === "" || numPedido.includes(termoBusca) || nomeCliente.includes(termoBusca) || (buscaLimpa !== "" && cpfCliente.includes(buscaLimpa));
        const passaStatus = filtroStatus === "TODOS" || p.status_nuvemshop === filtroStatus;
        const passaFeedback = filtroFeedback === "TODOS" || p.status_feedback === filtroFeedback;

        return passaBusca && passaStatus && passaFeedback;
    });

    const contadorElem = document.getElementById('contador-nuvem');
    if (contadorElem) contadorElem.innerText = `${dadosFiltrados.length} pedido(s)`;

    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPaginaNuvem);
    if (paginaAtualNuvem > totalPaginas && totalPaginas > 0) paginaAtualNuvem = totalPaginas;
    
    const inicio = (paginaAtualNuvem - 1) * itensPorPaginaNuvem;
    const itensDaPagina = dadosFiltrados.slice(inicio, inicio + itensPorPaginaNuvem);

    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Nenhum pedido atende aos filtros.</td></tr>';
    } else {
        itensDaPagina.forEach(p => {
            const dataO = new Date(p.data_criacao);
            
            // CORREÇÃO DEFINITIVA DO FUSO HORÁRIO: Horário Oficial de Brasília
            const opcoesData = { timeZone: 'America/Sao_Paulo' };
            const opcoesHora = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' };
            const dataF = dataO.toLocaleDateString('pt-BR', opcoesData) + ' ' + dataO.toLocaleTimeString('pt-BR', opcoesHora);
            
            const cpfFormatado = formatarDocumento(p.cpf_cliente || '-');
            
            let acaoFeedback = `<span class="selo status-wpp-pendente">Aguardando</span>`;
            if (p.status_feedback === 'Enviado') {
                acaoFeedback = `<span class="selo status-wpp-enviado" style="background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe;">Enviado</span>`;
            } else if (p.status_nuvemshop === 'Entregue') {
                const produtosSeguros = encodeURIComponent(p.produtos || ''); 
                acaoFeedback = `<button onclick="enviarFeedbackWpp('${p.id_pedido}', '${p.telefone}', '${p.nome_cliente}', '${p.numero_pedido}', '${produtosSeguros}')" style="background: #25d366; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 5px; margin: 0 auto;">Enviar WPP</button>`;
            }
            
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td style="white-space:nowrap">${dataF}</td>
                <td style="font-weight:bold; color:#2563eb;">#${p.numero_pedido}</td>
                <td>${p.nome_cliente || '-'}</td>
                <td style="white-space:nowrap">${cpfFormatado}</td>
                <td>${p.cidade || '-'}</td>
                <td>${p.estado || '-'}</td>
                <td>${p.transportadora || '-'}</td>
                <td>${p.rastreio || '-'}</td>
                <td>${p.status_nuvemshop || '-'}</td>
                <td style="text-align:center;">${acaoFeedback}</td>
            `;
            tbody.appendChild(linha);
        });
    }
    renderizarControlesPaginacaoNuvem(totalPaginas);
}

function renderizarControlesPaginacaoNuvem(totalPaginas) {
    const container = document.getElementById('paginacao-nuvem');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    
    let html = `
        <button class="btn-pag-nav" onclick="irParaPaginaNuvem(1)" ${paginaAtualNuvem === 1 ? 'disabled' : ''}>«</button>
        <button class="btn-pag-nav" onclick="mudarPaginaNuvem(-1)" ${paginaAtualNuvem === 1 ? 'disabled' : ''}>‹</button>
    `;
    let startPage = Math.max(1, paginaAtualNuvem - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4); 
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === paginaAtualNuvem ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPaginaNuvem(${i})">${i}</button>`;
    }
    html += `
        <button class="btn-pag-nav" onclick="mudarPaginaNuvem(1)" ${paginaAtualNuvem === totalPaginas ? 'disabled' : ''}>›</button>
        <button class="btn-pag-nav" onclick="irParaPaginaNuvem(${totalPaginas})" ${paginaAtualNuvem === totalPaginas ? 'disabled' : ''}>»</button>
    `;
    container.innerHTML = html;
}

function mudarPaginaNuvem(delta) { paginaAtualNuvem += delta; renderizarPaginaNuvem(); }
function irParaPaginaNuvem(pagina) { paginaAtualNuvem = pagina; renderizarPaginaNuvem(); }
function resetarPaginacaoNuvem() { paginaAtualNuvem = 1; renderizarPaginaNuvem(); }

// ============================================================================
// MÓDULO 5: TINY ERP E RELATÓRIOS
// ============================================================================

let todaABaseDeClientes = [];
let paginaAtualRelatorio = 1;
const itensPorPaginaRelatorio = 50;
let colunaOrdenacao = -1;
let ordemCrescente = true;

async function carregarClientesTinyDB() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Carregando clientes do Banco de Dados...</td></tr>';
    try {
        const resposta = await fetch('/api/relatorios/clientes');
        const data = await resposta.json();
        if (data.sucesso) {
            todaABaseDeClientes = data.clientes;
            resetarEPaginacao();
        } else {
            throw new Error("Falha no servidor");
        }
    } catch (e) { 
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro ao carregar clientes.</td></tr>`;
    }
}

function classificarClienteVisual(totalPedidos, valorTotal) {
    if (totalPedidos === 0) return '<span class="selo sem-compra">Sem Compras</span>';
    if (totalPedidos === 1) return '<span class="selo primeira-compra">1ª Compra</span>';
    if (valorTotal <= 1000) return '<span class="selo bronze">Bronze</span>';
    if (valorTotal <= 3000) return '<span class="selo prata">Prata</span>';
    if (valorTotal <= 6000) return '<span class="selo ouro">Ouro</span>';
    return '<span class="selo diamante">Diamante</span>';
}

function ordenarTabela(colIndex) {
    // 1. Define se vai ser crescente ou decrescente
    if (colunaOrdenacao === colIndex) {
        ordemCrescente = !ordemCrescente;
    } else {
        colunaOrdenacao = colIndex;
        ordemCrescente = true;
    }

    // 2. Ordena a base de dados
    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        
        // O Motor sabe exatamente que tipo de dado está em cada coluna
        switch(colIndex) {
            case 0: valA = (a.nome || '').toLowerCase(); valB = (b.nome || '').toLowerCase(); break;
            case 1: valA = (a.telefone || '').replace(/\D/g, ''); valB = (b.telefone || '').replace(/\D/g, ''); break;
            case 2: valA = (a.cpf || '').replace(/\D/g, ''); valB = (b.cpf || '').replace(/\D/g, ''); break;
            case 3: valA = (a.cidade || '').toLowerCase(); valB = (b.cidade || '').toLowerCase(); break;
            case 4: valA = (a.estado || '').toLowerCase(); valB = (b.estado || '').toLowerCase(); break;
            case 5: valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); break; 
            case 6: valA = parseInt(a.total_pedidos || 0); valB = parseInt(b.total_pedidos || 0); break;
            case 7: valA = parseFloat(a.ticket_medio || 0); valB = parseFloat(b.ticket_medio || 0); break;
            case 8: valA = parseInt(a.tempo_medio_entrega_dias || 0); valB = parseInt(b.tempo_medio_entrega_dias || 0); break;
            case 9: valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); break;
        }

        if (valA < valB) return ordemCrescente ? -1 : 1;
        if (valA > valB) return ordemCrescente ? 1 : -1;
        return 0;
    });

    // 3. Atualiza os ícones de setinhas na tela
    for(let i = 0; i <= 9; i++) {
        const icon = document.getElementById(`sort-icon-${i}`);
        if(icon) icon.innerText = '↕️'; 
    }
    const activeIcon = document.getElementById(`sort-icon-${colIndex}`);
    if(activeIcon) activeIcon.innerText = ordemCrescente ? '▲' : '▼'; // Acende o atual

    // 4. Redesenha a tela
    resetarEPaginacao();
}

function renderizarPaginaRelatorio() {
    const tbody = document.getElementById('tabela-clientes-body');
    if(!tbody) return;
    
    const filtroGrupo = document.getElementById("filtro-grupo")?.value || "TODOS";
    const termoBusca = (document.getElementById("filtro-texto")?.value || "").toLowerCase();
    
    let dadosFiltrados = todaABaseDeClientes.filter(c => {
        const nomeStr = (c.nome || "").toLowerCase();
        const cpfStr = (c.cpf || "").toLowerCase();
        
        if (termoBusca !== "" && !nomeStr.includes(termoBusca) && !cpfStr.includes(termoBusca)) return false;
        
        if (filtroGrupo !== "TODOS") {
            let totalPedidos = c.total_pedidos || 0;
            let valorTotal = parseFloat(c.valor_total || 0);
            let grupoReal = "SEM COMPRAS";
            if (totalPedidos === 1) grupoReal = "PRIMEIRA COMPRA";
            else if (totalPedidos > 1) {
                if (valorTotal <= 1000) grupoReal = "BRONZE";
                else if (valorTotal <= 3000) grupoReal = "PRATA";
                else if (valorTotal <= 6000) grupoReal = "OURO";
                else grupoReal = "DIAMANTE";
            }
            if (grupoReal !== filtroGrupo) return false;
        }
        return true;
    });

    const contadorElem = document.getElementById('contador-cadastros');
    if (contadorElem) contadorElem.innerText = `${dadosFiltrados.length} cadastro(s)`;

    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPaginaRelatorio);
    if (paginaAtualRelatorio > totalPaginas && totalPaginas > 0) paginaAtualRelatorio = totalPaginas;
    
    const inicio = (paginaAtualRelatorio - 1) * itensPorPaginaRelatorio;
    const itensDaPagina = dadosFiltrados.slice(inicio, inicio + itensPorPaginaRelatorio);

    tbody.innerHTML = ''; 
    if (itensDaPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Nenhum cliente encontrado.</td></tr>';
    } else {
        itensDaPagina.forEach(cliente => {
            const valTotalNum = parseFloat(cliente.valor_total || 0);
            const seloHtml = classificarClienteVisual(cliente.total_pedidos || 0, valTotalNum);
            const wppFormatado = formatarWhatsAppClicavel(cliente.telefone);
            const cpfFormatado = formatarDocumento(cliente.cpf);
            
            const ticketMedio = parseFloat(cliente.ticket_medio || 0).toFixed(2).replace('.', ',');
            const tempoEntrega = cliente.tempo_medio_entrega_dias > 0 ? `${cliente.tempo_medio_entrega_dias} dias` : '-';
            
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${cliente.nome}</td>
                <td style="white-space:nowrap">${wppFormatado}</td>
                <td style="white-space:nowrap">${cpfFormatado}</td>
                <td>${cliente.cidade || '-'}</td>
                <td>${cliente.estado || '-'}</td>
                <td>${seloHtml}</td>
                <td style="text-align:center; font-weight:bold;">${cliente.total_pedidos || 0}</td>
                <td style="white-space:nowrap">R$ ${ticketMedio}</td>
                <td style="text-align:center;">${tempoEntrega}</td>
                <td data-valor="${valTotalNum}" style="white-space:nowrap; font-weight:bold; color: #0f172a;">R$ ${valTotalNum.toFixed(2).replace('.', ',')}</td>
            `;
            tbody.appendChild(linha);
        });
    }
    renderizarControlesPaginacao(totalPaginas);
}

function renderizarControlesPaginacao(totalPaginas) {
    const container = document.getElementById('paginacao-ltv');
    if (!container) return;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    
    let html = `
        <button class="btn-pag-nav" onclick="irParaPagina(1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''}>«</button>
        <button class="btn-pag-nav" onclick="mudarPagina(-1)" ${paginaAtualRelatorio === 1 ? 'disabled' : ''}>‹</button>
    `;
    let startPage = Math.max(1, paginaAtualRelatorio - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4); 
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === paginaAtualRelatorio ? 'btn-pag-num active' : 'btn-pag-num'}" onclick="irParaPagina(${i})">${i}</button>`;
    }
    html += `
        <button class="btn-pag-nav" onclick="mudarPagina(1)" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''}>›</button>
        <button class="btn-pag-nav" onclick="irParaPagina(${totalPaginas})" ${paginaAtualRelatorio === totalPaginas ? 'disabled' : ''}>»</button>
    `;
    container.innerHTML = html;
}

function mudarPagina(delta) { paginaAtualRelatorio += delta; renderizarPaginaRelatorio(); }
function irParaPagina(pagina) { paginaAtualRelatorio = pagina; renderizarPaginaRelatorio(); }
function resetarEPaginacao() { paginaAtualRelatorio = 1; renderizarPaginaRelatorio(); }