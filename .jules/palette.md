## 2026-04-05 - Adding loading states and keyboard shortcuts to vanilla forms
**Learning:** Even simple vanilla JS APIs need loading states and keyboard interactivity to feel "complete." Using the `disabled` attribute along with visual opacity changes makes form states intuitive, and supporting the 'Enter' key submission on inputs drastically improves keyboard accessibility for small widgets.
**Action:** Always verify if standalone form inputs support 'Enter' for submission and provide immediate feedback (loading/disabled states) for async requests, especially when using simple `fetch` calls.

## 2024-04-03 - Added aria-label to icon-only button
**Learning:** Found an icon-only button in `login.js` missing an `aria-label`, making it inaccessible to screen readers.
**Action:** Added `aria-label` to the button for better accessibility. Will continue to check for similar issues in other templates.
## 2024-05-24 - Semantic Search Form with Loading State
**Learning:** In Vanilla JS applications, standalone search inputs wrapped in generic `<div>` containers fail to support native 'Enter' key submission and lack semantic context for screen readers. Furthermore, asynchronous actions need immediate visual feedback to prevent duplicate submissions and user confusion.
**Action:** When implementing Vanilla JS search widgets, always use semantic `<form>` tags over `<div>` containers. Provide an `aria-label` for inputs, use `input type="submit"`, prevent default submission to handle it via JS, and visually indicate the loading state by disabling the button and changing its text.
