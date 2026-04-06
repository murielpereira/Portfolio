# Portfólio

Uma aplicação web de portfólio pessoal para exibir projetos e habilidades, construída com tecnologias web puras (vanilla).

## 🔗 Demonstrações ao Vivo
- [Deploy no GitHub Pages](https://murielpereira.github.io/Portfolio/index.html)
- [Deploy na Vercel](https://murielpereira.vercel.app/)

## 🚀 Arquitetura e Tecnologias
Este projeto é construído utilizando:
- **HTML5 & CSS3**
- **Vanilla JavaScript**

Uma característica fundamental do portfólio é a sua arquitetura de carregamento dinâmico de conteúdo. Ele utiliza a moderna API `fetch` do JavaScript para carregar fragmentos de HTML (como o cabeçalho e diferentes seções) dentro de elementos marcadores (placeholders). Isso proporciona uma experiência de aplicação de página única (SPA), mantendo a base de código leve e livre de dependências pesadas de frameworks.

## 📁 Sub-projetos Incluídos
O portfólio vincula e hospeda vários sub-projetos menores dentro do diretório `projetos/`:
- **Calculadora**: Uma aplicação simples de calculadora.
- **Consulta CEP**: Uma ferramenta para consultar códigos postais brasileiros (CEP).
- **Rastreamento**: Uma aplicação de rastreamento de pacotes.
- **Waltz App**: Um aplicativo de automação (vinculado externamente para `https://waltz-automacao.vercel.app/`).

## 💻 Executando Localmente

Como este projeto usa a API `fetch` do JavaScript para carregar arquivos locais de fragmentos HTML, ele deve ser executado sobre um servidor web local (usar o protocolo `file://` resultará em erros de CORS/origem).

Você pode servi-lo facilmente usando Python ou Node.js:

**Usando Python 3:**
```bash
# Execute isso a partir do diretório raiz do projeto
python3 -m http.server 8000
```
Em seguida, abra `http://localhost:8000` no seu navegador.

**Usando Node.js / npm:**
Se você tiver o Node.js instalado, pode usar o `npx serve`:
```bash
npx serve .
```
Em seguida, abra a URL fornecida no terminal.
