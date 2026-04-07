# Portfólio

Uma aplicação web de portfólio pessoal para exibir projetos e habilidades, construída com tecnologias web puras (vanilla).

## 🔗 Demonstrações ao Vivo
- [Implantação no GitHub Pages](https://murielpereira.github.io/Portfolio/index.html)
- [Implantação na Vercel](https://murielpereira.vercel.app/)

## 🚀 Arquitetura e Tecnologias
Este projeto é construído usando:
- **HTML5 e CSS3**
- **JavaScript Vanilla**

Uma característica principal do portfólio é a sua arquitetura de carregamento dinâmico de conteúdo. Ele utiliza a moderna API `fetch` do JavaScript para carregar fragmentos de HTML (como o cabeçalho e diferentes seções) em elementos com espaço reservado. Isso proporciona uma experiência semelhante a uma aplicação de página única (SPA), mantendo a base de código leve e livre de dependências pesadas de frameworks.

## 📁 Subprojetos Incluídos
O portfólio possui links e hospeda vários subprojetos menores dentro do diretório `projetos/`:
- **Calculadora**: Um aplicativo de calculadora simples.
- **Consulta CEP**: Uma ferramenta para consultar códigos postais brasileiros (CEP).
- **Rastreamento**: Um aplicativo de rastreamento de encomendas.
- **Waltz App**: Um aplicativo de automação (link externo para `https://waltz-automacao.vercel.app/`).

## 💻 Executando Localmente

Como este projeto usa a API `fetch` do JavaScript para carregar arquivos locais com fragmentos de HTML, ele deve ser executado em um servidor web local (o uso do protocolo `file://` resultará em erros de CORS/origem).

Você pode executá-lo facilmente usando Python ou Node.js:

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
