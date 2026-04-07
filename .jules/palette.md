## 2026-04-05 - Adding loading states and keyboard shortcuts to vanilla forms
**Learning:** Even simple vanilla JS APIs need loading states and keyboard interactivity to feel "complete." Using the `disabled` attribute along with visual opacity changes makes form states intuitive, and supporting the 'Enter' key submission on inputs drastically improves keyboard accessibility for small widgets.
**Action:** Always verify if standalone form inputs support 'Enter' for submission and provide immediate feedback (loading/disabled states) for async requests, especially when using simple `fetch` calls.

## 2024-04-03 - Added aria-label to icon-only button
**Learning:** Found an icon-only button in `login.js` missing an `aria-label`, making it inaccessible to screen readers.
**Action:** Added `aria-label` to the button for better accessibility. Will continue to check for similar issues in other templates.
