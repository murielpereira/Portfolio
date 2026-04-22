## 2025-04-02 - Frontend Debouncing and Caching
**Learning:** Found a common performance anti-pattern in the frontend tracking search module where an expensive external API request (SmartEnvios tracking) was triggered on every button click without debouncing or caching. If the user spam-clicked or re-searched the same tracking code, redundant external proxy + API fetch operations would queue up, unnecessarily taxing bandwidth and potentially hitting API rate limits.
**Action:** Implemented a `Map` based in-memory cache for tracking results within the single-page application session. Also added UI debouncing by disabling the search button and input fields while an API fetch is in progress. Always ensure frequent user-triggered network requests have proper debouncing/throttling and consider caching for idempotent lookups.

## 2024-05-24 - Duplicate Script Execution
**Learning:** The application was loading `script.js` twice on `index.html` and `snippets/projetos.html` (once as regular script, once as module). This caused double network requests for snippets, duplicate executions of `script.js` setup code.
**Action:** Removed the duplicate standard `<script>` tag and kept only `<script type="module">`. `<script type="module">` is better since it runs deferred by default, not blocking the parser. In the future, verify `index.html` and entrypoints for duplicate standard/module script tags if performance or double-fetch issues are reported.

## 2025-05-15 - Audio Instantiation Performance
**Learning:** Found a performance bottleneck where `new Audio()` was instantiated repeatedly inside high-frequency event listeners (like calculator keypresses or clicks). This creates unnecessary garbage collection pressure and can lead to playback delays or dropped frames due to repeated network/file overhead.
**Action:** Implemented caching for the `Audio` instance. When overlapping sounds are required (e.g., rapid clicks), it's more performant to cache the base audio object once and clone it (`cachedAudio.cloneNode().play()`) or reset `currentTime` on a single cached instance rather than instantiating a completely new object every time.
