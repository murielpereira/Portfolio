fetch('/snippets/header.html')
    .then(response => response.text())
    .then(data => {
        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.innerHTML = data;
        }
    })
    .catch(error => console.error('Erro ao carregar o header:', error));

fetch('/snippets/first-section.html')
    .then(response => response.text())
    .then(data => {
        const placeholder = document.getElementById('first-section-placeholder');
        if (placeholder) { // Verifica se o elemento existe nesta página antes de injetar
            placeholder.innerHTML = data;
            iniciarTypewriter(); // Chama o efeito de escrever
        }
    })
    .catch(error => console.error('Erro ao carregar a section:', error));