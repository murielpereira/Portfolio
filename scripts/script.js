/*
fetch('/snippets/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
})

fetch('snippets/first-section.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('first-section-placeholder').innerHTML = data;
        iniciarTypewriter();
})
*/

import { SpeedInsights } from "@vercel/speed-insights/next"

// 1. O JavaScript pergunta: "Estou no GitHub?"
const estaNoGitHub = window.location.hostname.includes('github.io');

// 2. Se estiver no GitHub, usamos a pasta /Portfolio. Se estiver no PC, usamos apenas /
const caminhoBase = estaNoGitHub ? '/Portfolio' : '';

// 3. Agora fazemos o fetch somando o caminho base correto!
fetch(caminhoBase + '/snippets/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Erro ao carregar o header:', error));

// Fazemos o mesmo para o first-section
fetch(caminhoBase + '/snippets/first-section.html')
    .then(response => response.text())
    .then(data => {
        const placeholder = document.getElementById('first-section-placeholder');
        if (placeholder) { // Verifica se o elemento existe nesta página antes de injetar
            placeholder.innerHTML = data;
            iniciarTypewriter(); // Chama o efeito de escrever
        }
    })
    .catch(error => console.error('Erro ao carregar a section:', error));