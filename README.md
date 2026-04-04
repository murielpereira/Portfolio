# Portfólio

Uma aplicação web de portfólio pessoal para mostrar projetos e habilidades, construída com tecnologias web vanilla.

## 🔗 Demos Ao Vivo
- [Implantação no GitHub Pages](https://murielpereira.github.io/Portfolio/index.html)
- [Implantação na Vercel](https://murielpereira.vercel.app/)

## 🚀 Arquitetura e Tecnologias
Este projeto é construído usando:
- **HTML5 & CSS3**
- **JavaScript Vanilla**

Uma característica principal do portfólio é a sua arquitetura de carregamento dinâmico de conteúdo. Ele utiliza a moderna API `fetch` do JavaScript para carregar trechos de HTML (como o cabeçalho e diferentes seções) em elementos de espaço reservado (placeholders). Isso proporciona uma experiência semelhante a uma aplicação de página única (SPA), mantendo a base de código leve e livre de dependências de frameworks pesados.

## 📁 Subprojetos Incluídos
O portfólio contém links e hospeda vários subprojetos menores dentro do diretório `projetos/`:
- **Calculadora**: Um aplicativo simples de calculadora.
- **Consulta CEP**: Uma ferramenta para consultar Códigos de Endereçamento Postal (CEP) do Brasil.
- **Rastreamento**: Um aplicativo de rastreamento de encomendas.
- **Waltz App**: Um aplicativo de automação (com link externo para `https://waltz-automacao.vercel.app/`).

## 💻 Executando Localmente

Como este projeto usa a API `fetch` do JavaScript para carregar arquivos de trechos HTML locais, ele deve ser executado em um servidor web local (o uso do protocolo `file://` resultará em erros de CORS/origem).

Você pode servi-lo facilmente usando Python ou Node.js:

**Usando Python 3:**
```bash
# Execute isso a partir do diretório raiz do projeto
python3 -m http.server 8000
```
Em seguida, abra `http://localhost:8000` no seu navegador.

**Usando Node.js / npm:**
Se você tem o Node.js instalado, você pode usar o `npx serve`:
```bash
npx serve .
```
Em seguida, abra a URL fornecida no terminal.
