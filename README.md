# Portfolio

A personal portfolio web application to showcase projects and skills, built with vanilla web technologies.

## 🔗 Live Demos
- [GitHub Pages Deployment](https://murielpereira.github.io/Portfolio/index.html)
- [Vercel Deployment](https://murielpereira.vercel.app/)

## 🚀 Architecture and Technologies
This project is built using:
- **HTML5 & CSS3**
- **Vanilla JavaScript**

A key feature of the portfolio is its dynamic content loading architecture. It utilizes the modern JavaScript `fetch` API to load HTML snippets (like the header and different sections) into placeholder elements. This provides a single-page application (SPA) like experience while keeping the codebase lightweight and free of heavy framework dependencies.

## 📁 Included Sub-projects
The portfolio links to and hosts several smaller sub-projects within the `projetos/` directory:
- **Calculadora**: A simple calculator application.
- **Consulta CEP**: A tool to query Brazilian ZIP codes (CEP).
- **Rastreamento**: A package tracking application.
- **Waltz App**: An automation app (linked externally to `https://waltz-automacao.vercel.app/`).

## 💻 Running Locally

Because this project uses the JavaScript `fetch` API to load local HTML snippet files, it must be run over a local web server (using `file://` protocol will result in CORS/origin errors).

You can easily serve it using Python or Node.js:

**Using Python 3:**
```bash
# Run this from the root directory of the project
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Using Node.js / npm:**
If you have Node.js installed, you can use `npx serve`:
```bash
npx serve .
```
Then open the URL provided in the terminal.
