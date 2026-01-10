function mudarImagemColeira(radio, idElemento) {
    const corSelecionada = radio.value; // O valor do radio button (por exemplo, "verde")
    const elemento = document.getElementById(idElemento);
    // Define o background de acordo com o valor do radio
    elemento.style.backgroundImage = `url('imagens/vitoria/cor1/${corSelecionada}.png')`;
}

function mudarImagemDetalhe(radio, idElemento) {
    const corSelecionada = radio.value; // O valor do radio button (por exemplo, "verde")
    const elemento = document.getElementById(idElemento);
    // Define o background de acordo com o valor do radio
    elemento.style.backgroundImage = `url('imagens/vitoria/cor2/${corSelecionada}.png')`;
}

function mudarImagemMetal(radio, idElemento) {
    const corSelecionada = radio.value; // O valor do radio button (por exemplo, "verde")
    const elemento = document.getElementById(idElemento);
    // Define o background de acordo com o valor do radio
    elemento.style.backgroundImage = `url('imagens/vitoria/metal/${corSelecionada}.png')`;
}

function mudarImagemPedras(radio, idElemento) {
    const corSelecionada = radio.id; // O valor do radio button (por exemplo, "verde")
    const elemento = document.getElementById(idElemento);
    // Define o background de acordo com o valor do radio
    elemento.style.backgroundImage = `url('imagens/vitoria/pedras/${corSelecionada}.png')`;
}

function selecionarBotaoMetal(botao) {
    const botoes = document.querySelectorAll('.cor-metal input[type="button"]');
    botoes.forEach(btn => btn.classList.remove('botao-selecionado'));
    botao.classList.add('botao-selecionado');
}

function selecionarBotaoPedras(botao) {
    const botoes = document.querySelectorAll('.cor-pedras input[type="button"]');
    botoes.forEach(btn => btn.classList.remove('botao-selecionado'));
    botao.classList.add('botao-selecionado');
}

function atualizarTexto() {
    const input = document.getElementById('texto');
    const contador = document.getElementById('contador');
    const texto = input.value;
    const limite = 10; // Limite de caracteres

    if (texto.length > limite) {
        input.value = texto.substring(0, limite); // impede ultrapassar
    }

    contador.textContent = `${input.value.length} / ${limite}`;

    // Altera cor do contador se o limite for atingido
    if (input.value.length === limite) {
        contador.classList.add('limite-atingido');
    } else {
        contador.classList.remove('limite-atingido');
    }

    document.getElementById('nome-pet').textContent = input.value;
}
