## 2025-04-02 - Frontend Debouncing and Caching
**Learning:** Found a common performance anti-pattern in the frontend tracking search module where an expensive external API request (SmartEnvios tracking) was triggered on every button click without debouncing or caching. If the user spam-clicked or re-searched the same tracking code, redundant external proxy + API fetch operations would queue up, unnecessarily taxing bandwidth and potentially hitting API rate limits.
**Action:** Implemented a `Map` based in-memory cache for tracking results within the single-page application session. Also added UI debouncing by disabling the search button and input fields while an API fetch is in progress. Always ensure frequent user-triggered network requests have proper debouncing/throttling and consider caching for idempotent lookups.

## 2024-05-24 - Duplicate Script Execution
**Learning:** The application was loading `script.js` twice on `index.html` and `snippets/projetos.html` (once as regular script, once as module). This caused double network requests for snippets, duplicate executions of `script.js` setup code.
**Action:** Removed the duplicate standard `<script>` tag and kept only `<script type="module">`. `<script type="module">` is better since it runs deferred by default, not blocking the parser. In the future, verify `index.html` and entrypoints for duplicate standard/module script tags if performance or double-fetch issues are reported.

## 2026-04-21 - UI Audio Caching
**Learning:** Found a performance bottleneck in the calculator application where a new `Audio` object was instantiated and fetched on every button click. For high-frequency events like rapid calculator use, this causes redundant network requests and unnecessary garbage collection overhead, potentially leading to audio skipping or UI lag.
**Action:** Implemented a global cached `Audio` instance using `var cachedClickAudio = new Audio('sons/click.mp3');` and utilized `cachedClickAudio.cloneNode().play()` inside the click handlers. Always cache audio instances for recurring UI sounds to minimize memory and network overhead.
