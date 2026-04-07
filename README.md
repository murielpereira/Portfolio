# Portfólio

Um aplicativo web de portfólio pessoal para exibir projetos e habilidades, construído com tecnologias web puras (vanilla).

## 🔗 Demonstrações ao Vivo
- [Implantação no GitHub Pages](https://murielpereira.github.io/Portfolio/index.html)
- [Implantação no Vercel](https://murielpereira.vercel.app/)

## 🚀 Arquitetura e Tecnologias
Este projeto é construído usando:
- **HTML5 & CSS3**
- **JavaScript Puro (Vanilla)**

Uma característica fundamental do portfólio é a sua arquitetura de carregamento de conteúdo dinâmico. Ele utiliza a moderna API `fetch` do JavaScript para carregar fragmentos de HTML (como o cabeçalho e diferentes seções) em elementos de espaço reservado (placeholders). Isso proporciona uma experiência semelhante a um aplicativo de página única (SPA), mantendo a base de código leve e livre de dependências pesadas de frameworks.

## 📁 Subprojetos Incluídos
O portfólio vincula e hospeda vários subprojetos menores dentro do diretório `projetos/`:
- **Calculadora**: Um aplicativo de calculadora simples.
- **Consulta CEP**: Uma ferramenta para consultar CEPs brasileiros.
- **Rastreamento**: Um aplicativo de rastreamento de encomendas.
- **Waltz App**: Um aplicativo de automação (vinculado externamente a `https://waltz-automacao.vercel.app/`).

## 💻 Executando Localmente

Como este projeto usa a API `fetch` do JavaScript para carregar arquivos de fragmentos HTML locais, ele deve ser executado sobre um servidor web local (usar o protocolo `file://` resultará em erros de CORS/origem).

Você pode facilmente servi-lo usando Python ou Node.js:

**Usando Python 3:**
```bash
# Execute isso a partir do diretório raiz do projeto
python3 -m http.server 8000
```
Em seguida, abra `http://localhost:8000` no seu navegador.

**Usando Node.js / npm:**
Se você tem o Node.js instalado, você pode usar `npx serve`:
```bash
npx serve .
```
Em seguida, abra a URL fornecida no terminal.
