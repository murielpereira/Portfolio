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