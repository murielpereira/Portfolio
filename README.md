# Portfólio

Uma aplicação web de portfólio pessoal para exibir projetos e habilidades, construída com tecnologias web puras (vanilla).

## 🔗 Demonstrações ao Vivo
- [Implantação no GitHub Pages](https://murielpereira.github.io/Portfolio/index.html)
- [Implantação na Vercel](https://murielpereira.vercel.app/)

## 🚀 Arquitetura e Tecnologias
Este projeto foi desenvolvido utilizando:
- **HTML5 e CSS3**
- **JavaScript Puro (Vanilla JavaScript)**

Uma característica principal do portfólio é a sua arquitetura de carregamento dinâmico de conteúdo. Ele utiliza a moderna API `fetch` do JavaScript para carregar fragmentos de HTML (como o cabeçalho e as diferentes seções) em elementos de marcação (placeholders). Isso proporciona uma experiência de aplicação de página única (SPA), mantendo o código base leve e livre de dependências pesadas de frameworks.

## 📁 Subprojetos Incluídos
O portfólio se conecta e hospeda vários subprojetos menores dentro do diretório `projetos/`:
- **Calculadora**: Uma aplicação de calculadora simples.
- **Consulta CEP**: Uma ferramenta para buscar Códigos de Endereçamento Postal (CEP) brasileiros.
- **Rastreamento**: Uma aplicação de rastreamento de encomendas.
- **Waltz App**: Um aplicativo de automação (link externo para `https://waltz-automacao.vercel.app/`).

## 💻 Executando Localmente

Como este projeto utiliza a API `fetch` do JavaScript para carregar os arquivos de fragmentos HTML locais, ele precisa ser executado por meio de um servidor web local (utilizar o protocolo `file://` resultará em erros de CORS/origem).

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
