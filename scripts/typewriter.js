// 1. As palavras que queremos que o código digite
const palavras = ["UI/UX Lover", "Code Artist", "Frontend Developer"];

// 2. Variáveis de controlo
let palavraIndex = 0;
let letraIndex = 0;
let estaApagando = false;

// Transformamos a lógica principal numa função que podemos chamar depois
function iniciarTypewriter() {
    // Só procuramos o elemento quando esta função for chamada
    const elementoTexto = document.querySelector(".texto-digitado");
    
    // Se o elemento não existir, paramos por aqui para evitar erros
    if (!elementoTexto) return;

    function digitar() {
        const palavraAtual = palavras[palavraIndex];

        if (estaApagando) {
            letraIndex--;
        } else {
            letraIndex++;
        }

        elementoTexto.textContent = palavraAtual.substring(0, letraIndex);

        let velocidadeDigitacao = 100;

        if (estaApagando) {
            velocidadeDigitacao = 50;
        }

        if (!estaApagando && letraIndex === palavraAtual.length) {
            velocidadeDigitacao = 2000;
            estaApagando = true;
        } else if (estaApagando && letraIndex === 0) {
            estaApagando = false;
            palavraIndex++;
            
            if (palavraIndex === palavras.length) {
                palavraIndex = 0;
            }
            velocidadeDigitacao = 500;
        }

        setTimeout(digitar, velocidadeDigitacao);
    }

    // Inicia a primeira digitação
    setTimeout(digitar, 1000); 
}