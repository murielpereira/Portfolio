// ============================================================================
// MÓDULO 1: UTILITÁRIOS E FORMATAÇÕES GERAIS
// ============================================================================

// Formata CPF/CNPJ adicionando pontos e traços
function formatarDocumento(doc) {
    if (!doc) return '-';
    const num = doc.replace(/\D/g, '');
    if (num.length === 11) return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (num.length === 14) return num.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return doc;
}

// Cria um link clicável para números de WhatsApp
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

// Alterna a visibilidade da senha na tela de login
function toggleSenha() {
    const input = document.getElementById('senha');
    const icone = document.getElementById('icone-senha');
    if (input.type === 'password') {
        input.type = 'text';
        icone.innerText = 'visibility_off';
    } else {
        input.type = 'password';
        icone.innerText = 'visibility';
    }
}

// ============================================================================
// MÓDULO 2: INICIALIZAÇÃO E NAVEGAÇÃO DE ABAS
// ============================================================================

function loadApp(view) {
    if (view === 'login') {
        document.getElementById('btn-mostrar-senha')?.addEventListener('click', toggleSenha);
    } else if (view === 'painel') {
        mostrarSubPaginaDash('tiny'); // Abre a aba do Tiny por padrão ao fazer login
        document.getElementById('btn-logout')?.addEventListener('click', realizarLogout);
    }
}

// Controla a exibição das abas e dispara o carregamento de dados
async function mostrarSubPaginaDash(idAlvo) {
    // Esconde todas
    document.querySelectorAll('.sub-pagina').forEach(el => el.style.display = 'none');
    
    // Mostra a selecionada
    const painelAlvo = document.getElementById(`sub-${idAlvo}`);
    if (painelAlvo) painelAlvo.style.display = 'block';

    // Carrega os dados do banco de acordo com a aba escolhida
    if (idAlvo === 'tiny') {
        await carregarClientesTinyDB();
    } else if (idAlvo === 'nuvem') {
        await carregarPedidosNuvemDB();
    }
}

// ============================================================================
// MÓDULO 3: NUVEMSHOP E AUTOMAÇÃO DE WHATSAPP
// ============================================================================
let todosOsPedidosNuvem = [];
let paginaAtualNuvem = 1;
const itensPorPaginaNuvem = 50;

// Busca os pedidos no nosso Banco de Dados
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

// Dispara o feedback pelo WhatsApp
async function enviarFeedbackWpp(idPedido, telefone, nome, numPedido, produtosCodificados) {
    if (!telefone || telefone === 'undefined' || telefone.trim() === '') {
        alert("⚠️ Este pedido não possui telefone cadastrado no banco de dados.");
        return;
    }

    const numeroApenasDigitos = telefone.replace(/\D/g, '');
    const primeiroNome = nome.split(' ')[0]; 
    const produtos = decodeURIComponent(produtosCodificados); // Decodifica a string segura
    
    // Monta o trecho dos produtos, se eles existirem no banco
    let trechoProdutos = '';
    if (produtos && produtos.trim() !== '' && produtos !== 'undefined') {
        trechoProdutos = `\n\n📦 *Itens do pedido:* ${produtos}`;
    }

    // A sua mensagem personalizada da Bia
    const mensagem = `Oii ${primeiroNome}, tudo bem? Aqui é a Bia, da Âme Acessórios Pet.\n\nEstou entrando em contato pra saber se deu tudo certo com o seu pedido #${numPedido}.${trechoProdutos}\n\nVocê gostou do produto? Serviu direitinho? Teve algum problema ou dificuldade desde o momento da compra até a entrega?😀\n\nEsperamos sempre esse prazo para saber seu feedback, pois é o tempo que seu pet já usou e se adaptou com as nossas peças, e queremos sua opinião sincera, para que possamos sempre melhorar 🥰\n\nFico no aguardo da sua resposta.\n☺️☺️`;
    
    // Abre o WhatsApp
    const linkZap = `https://wa.me/55${numeroApenasDigitos}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkZap, '_blank');

    // Avisa o servidor para marcar como enviado
    try {
        await fetch('/api/pedidos/marcar-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_pedido: idPedido })
        });
        await carregarPedidosNuvemDB(); 
    } catch (erro) {
        console.error("Falha ao marcar como enviado", erro);
    }
}

// Renderiza a tabela da Nuvemshop e aplica os filtros
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
            const dataF = dataO.toLocaleDateString('pt-BR') + ' ' + dataO.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            const cpfFormatado = formatarDocumento(p.cpf_cliente || '-');
            
            // Lógica do botão de WhatsApp
            let acaoFeedback = `<span class="selo status-wpp-pendente">Aguardando</span>`;
            if (p.status_feedback === 'Enviado') {
                acaoFeedback = `<span class="selo status-wpp-enviado" style="background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe;">Enviado</span>`;
            } else if (p.status_nuvemshop === 'Entregue') {
                // Codificamos os produtos para evitar que aspas quebrem o HTML do botão
                const produtosSeguros = encodeURIComponent(p.produtos || ''); 
                
                acaoFeedback = `<button onclick="enviarFeedbackWpp('${p.id_pedido}', '${p.telefone}', '${p.nome_cliente}', '${p.numero_pedido}', '${produtosSeguros}')" 
                                style="background: #25d366; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 5px; margin: 0 auto;">
                                Enviar WPP
                                </button>`;
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

// Controles de páginação Nuvemshop
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
// MÓDULO 4: TINY ERP E RELATÓRIOS
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
    if (totalPedidos === 0) return '<span class="selo selo-sem-compras">Sem Compras</span>';
    if (totalPedidos === 1) return '<span class="selo selo-primeira">1ª Compra</span>';
    if (valorTotal <= 1000) return '<span class="selo selo-bronze">Bronze</span>';
    if (valorTotal <= 3000) return '<span class="selo selo-prata">Prata</span>';
    if (valorTotal <= 6000) return '<span class="selo selo-ouro">Ouro</span>';
    return '<span class="selo selo-diamante">Diamante</span>';
}

function ordenarTabela(colIndex) {
    if (colunaOrdenacao === colIndex) {
        ordemCrescente = !ordemCrescente;
    } else {
        colunaOrdenacao = colIndex;
        ordemCrescente = true;
    }

    todaABaseDeClientes.sort((a, b) => {
        let valA, valB;
        if (colIndex === 6) { valA = a.total_pedidos || 0; valB = b.total_pedidos || 0; }
        else if (colIndex === 7) { valA = parseFloat(a.valor_total || 0); valB = parseFloat(b.valor_total || 0); }
        
        return ordemCrescente ? valA - valB : valB - valA;
    });

    document.getElementById('sort-icon-6').innerText = colIndex === 6 ? (ordemCrescente ? '▲' : '▼') : '↕️';
    document.getElementById('sort-icon-7').innerText = colIndex === 7 ? (ordemCrescente ? '▲' : '▼') : '↕️';

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
            
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${cliente.nome}</td>
                <td style="white-space:nowrap">${wppFormatado}</td>
                <td style="white-space:nowrap">${cpfFormatado}</td>
                <td>${cliente.cidade || '-'}</td>
                <td>${cliente.estado || '-'}</td>
                <td>${seloHtml}</td>
                <td>${cliente.total_pedidos || 0}</td>
                <td data-valor="${valTotalNum}">R$ ${valTotalNum.toFixed(2).replace('.', ',')}</td>
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

// ============================================================================
// MÓDULO 5: AUTENTICAÇÃO E INICIALIZAÇÃO (O Motor de Partida)
// ============================================================================

// 1. Função que envia os dados de Login para o servidor
async function realizarLogin(event) {
    event.preventDefault(); // Impede a página de piscar/recarregar
    
    const usuario = document.getElementById('usuario')?.value;
    const senha = document.getElementById('senha')?.value;
    const btn = document.getElementById('btn-login');
    
    if (btn) { btn.innerText = 'Acessando...'; btn.disabled = true; }

    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            window.location.reload(); // Atualiza a página para carregar o painel
        } else {
            alert('Usuário ou senha incorretos!');
        }
    } catch (erro) {
        alert('Erro ao conectar com o servidor.');
    } finally {
        if (btn) { btn.innerText = 'Entrar'; btn.disabled = false; }
    }
}

// 2. Função para sair do sistema
async function realizarLogout() {
    try {
        await fetch('/api/logout');
        window.location.reload();
    } catch (erro) {
        console.error("Erro ao sair:", erro);
    }
}

// 3. A IGNição: O que o navegador faz assim que a tela abre
document.addEventListener('DOMContentLoaded', async () => {
    
    // Conecta o botão de login à nossa função
    const formLogin = document.getElementById('form-login');
    if (formLogin) formLogin.addEventListener('submit', realizarLogin);

    try {
        // Pergunta ao servidor se existe alguém logado
        const resposta = await fetch('/api/check-session');
        const dados = await resposta.json();
        
        // Mapeia as "caixas" principais do seu HTML
        // Nota: Se os IDs no seu HTML forem diferentes, basta ajustar aqui!
        const telaLogin = document.getElementById('tela-login') || document.querySelector('.login-container'); 
        const telaPainel = document.getElementById('tela-painel') || document.querySelector('.painel-container');
        
        if (dados.logado) {
            // Se tem acesso: Esconde o login e mostra o painel
            if (telaLogin) telaLogin.style.display = 'none';
            if (telaPainel) telaPainel.style.display = 'block';
            loadApp('painel'); // Aciona as abas (Tiny e Nuvemshop)
        } else {
            // Se não tem acesso: Esconde o painel e mostra o login
            if (telaLogin) telaLogin.style.display = 'flex'; // ou 'block'
            if (telaPainel) telaPainel.style.display = 'none';
            loadApp('login'); // Prepara o olho de mostrar senha
        }
    } catch (erro) {
        console.error("Erro fatal na inicialização:", erro);
    }
});