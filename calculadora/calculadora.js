fetch('../menu.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('menu-placeholder').innerHTML = data;
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

//Código para receber inputs do teclado
document.addEventListener('keydown', function(event) {
    const tecla = event.key;

    // Mapeamento de teclas numéricas
    if (tecla >= 0 && tecla <= 9) {
        calcular('valor', parseInt(tecla));
    }

    // Mapeamento de operadores e ações
    if (tecla === '+' || tecla === '-' || tecla === '*' || tecla === '/' || tecla === '.') {
        calcular('acao', tecla);
    }

    // Enter para calcular o resultado (=)
    if (tecla === 'Enter') {
        event.preventDefault(); // Impede o comportamento padrão do navegador
        calcular('acao', '=');
    }

    // Backspace ou 'c' para limpar (C)
    if (tecla === 'Backspace' || tecla.toLowerCase() === 'c') {
        calcular('acao', 'c');
    }

    // Opcional: Esc para fechar o popup se estiver aberto
    if (tecla === 'Escape') {
        fecharPopup();
    }
});