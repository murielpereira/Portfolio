# Portfolio Feature Ideas

Based on an analysis of the repository, here are 3 feature ideas to improve the project:

## 1. Implement Dark/Light Mode Toggle Logic
**Description:**
The application's UI currently includes a theme toggle button in the header (`snippets/header.html`) with an SVG moon icon. However, there is no corresponding JavaScript logic to actually switch the CSS theme.
**Implementation Details:**
- Add JavaScript logic to listen for click events on the `.mode-selection button`.
- Create a CSS class (e.g., `.light-mode`) in `styles/style.css` that overrides the default CSS variables (`--cor-fundo`, `--cor-texto-secundario`, etc.) with light theme colors.
- Use `localStorage` to persist the user's theme preference across sessions and page reloads.

## 2. Enhance SPA Architecture with Client-Side Routing
**Description:**
The portfolio currently uses the `fetch` API to load snippets (like `header.html` and `first-section.html`) into placeholders, creating a pseudo-SPA experience. However, clicking on links like "projetos()" in the header (`snippets/projetos.html`) triggers a full page reload, breaking the SPA illusion.
**Implementation Details:**
- Implement a lightweight Vanilla JS client-side router (e.g., using the `History API` and `popstate` events).
- Intercept link clicks (`<a>` tags) within the application.
- Instead of navigating the browser to a new HTML file, use `fetch` to load the corresponding content snippet and inject it into a main content container, updating the URL via `history.pushState()`. This provides a smoother, faster transition between pages.

## 3. Implement Missing Content Sections and Smooth Scrolling
**Description:**
The header (`snippets/header.html`) contains navigation links for `sobre()`, `skills()`, and `contato()`, but these links currently have empty `href` attributes.
**Implementation Details:**
- Create new HTML snippet files for each missing section (e.g., `snippets/sobre.html`, `snippets/skills.html`, `snippets/contato.html`).
- Add the corresponding placeholders in `index.html`.
- Update `scripts/script.js` to fetch and inject these new sections on the homepage.
- Add anchor links to the `href` attributes in the header (e.g., `href="#sobre"`).
- Implement CSS `scroll-behavior: smooth;` on the `html` element or JavaScript-based smooth scrolling to allow users to gracefully scroll down to these sections when clicking the navigation links.