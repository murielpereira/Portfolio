# Feature Ideas for Portfolio

Based on the analysis of the vanilla HTML/CSS/JavaScript repository, here are 3 feature ideas to enhance the application:

## 1. Light/Dark Theme Toggle Implementation
**Description:** The header component (`snippets/header.html`) currently includes a button with a moon icon intended for toggling the theme, but it lacks the underlying JavaScript functionality and CSS styles to support it.
**Implementation Steps:**
- Add a JavaScript event listener in `scripts/script.js` to the mode-selection button.
- Upon clicking, toggle a CSS class (e.g., `light-theme`) on the `body` element.
- Save the user's preference in `localStorage` so the selected theme persists across page reloads.
- Define light theme CSS variables (e.g., `--cor-fundo`, `--cor-texto-primario`, etc.) inside the `.light-theme` scope in `styles/style.css` to update the look and feel.

## 2. Dynamic Section Loading for Navigation
**Description:** The navigation links in the header (`sobre()`, `skills()`, `currículo()`, `contato()`) are currently inactive placeholder links. To fully realize the intended Single Page Application (SPA) architecture, these links should dynamically load their respective sections.
**Implementation Steps:**
- Create the missing HTML snippet files in the `/snippets/` directory (e.g., `sobre.html`, `skills.html`, `contato.html`).
- Add event listeners to the header navigation links in `scripts/script.js` to intercept clicks (`e.preventDefault()`).
- Use the `fetch` API to retrieve the correct snippet and inject it into a main content placeholder (similar to how `first-section.html` is currently loaded).
- Consider implementing the History API (`history.pushState`) to update the URL without reloading the page, allowing users to share links to specific sections.

## 3. Mobile Responsiveness Improvements
**Description:** The layout currently uses rigid spacing (e.g., `padding: 1rem 15rem;` on `.top-header` and `margin-top: 200px;` on `.first-section`) which causes rendering issues on smaller screens and mobile devices.
**Implementation Steps:**
- Introduce CSS media queries (e.g., `@media (max-width: 768px)`) in `styles/style.css`.
- Update the padding and margins to use relative units (`%`, `vw/vh`) or significantly smaller fixed values for mobile breakpoints.
- Convert the header layout to a responsive design (e.g., a hamburger menu for navigation links on small screens).
- Adjust the typography sizes, especially the large `72px` font for the name, to fit mobile displays appropriately.
