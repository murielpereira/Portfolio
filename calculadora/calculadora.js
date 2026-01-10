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