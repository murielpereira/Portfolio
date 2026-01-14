fetch('../header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
})

function soarClick() {
    var click = new Audio('sons/click.mp3')

    click.currentTime = 0.05
    click.play()
}

function calcular(tipo, valor) {

    var click = new Audio('sons/click.mp3')

    click.currentTime = 0.05
    click.play()

    console.log(tipo, valor)

    if(tipo === 'acao') {

        if(valor === 'c') {
            document.getElementById('resultado').value = ''
        }

        if(valor === '+' || valor === '-' || valor === '*' || valor === '/' || valor === '.') {
            document.getElementById('resultado').value += valor
        }

        if(valor === '=') {
            var historico = document.getElementById('resultado').value + '='
            var valor_campo = eval(document.getElementById('resultado').value)
            console.log(eval(valor_campo))
            document.getElementById('historico').value = historico + valor_campo
            document.getElementById('resultado').value = valor_campo
        }

    } else if(tipo === 'valor') {
        var valor_campo = document.getElementById('resultado').value
        document.getElementById('resultado').value += valor
    }
}

var contadorCliques = 0;
var timer; 

function verificarEasterEgg() {
    clearTimeout(timer);
    contadorCliques++;

    console.log("Cliques: " + contadorCliques);

    if (contadorCliques === 10) {
        exibirPopup();
        contadorCliques = 0;
    }

    timer = setTimeout(function() {
        contadorCliques = 0;
        console.log("Tempo esgotado, contador resetado.");
    }, 2000); 
}

function exibirPopup() {
    var popup = document.getElementById('easterEggPopup');
    popup.classList.remove('popup-oculto');
    popup.classList.add('popup-visivel');

    var nazare = new Audio('sons/nazare.mp3')
    nazare.currentTime = 5
    nazare.play()

    setTimeout(function() {
        nazare.pause();
    }, 2000);
}

function fecharPopup() {
    var popup = document.getElementById('easterEggPopup');
    popup.classList.remove('popup-visivel');
    popup.classList.add('popup-oculto');
}