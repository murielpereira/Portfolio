## 2024-04-07 - Async Form Visual Feedback
**Learning:** Adding visual feedback (like changing a button's text to 'Pesquisando...' and disabling it) during asynchronous `fetch` requests prevents users from clicking multiple times and makes the UI feel significantly more responsive, even when the API is slow. Also, enabling 'Enter' key submission makes simple forms much more accessible to keyboard users.
**Action:** Always verify standalone Vanilla JS forms in this repository to ensure they support 'Enter' key submission and provide immediate visual feedback for `fetch` operations.
