## 2026-04-05 - Adding loading states and keyboard shortcuts to vanilla forms
**Learning:** Even simple vanilla JS APIs need loading states and keyboard interactivity to feel "complete." Using the `disabled` attribute along with visual opacity changes makes form states intuitive, and supporting the 'Enter' key submission on inputs drastically improves keyboard accessibility for small widgets.
**Action:** Always verify if standalone form inputs support 'Enter' for submission and provide immediate feedback (loading/disabled states) for async requests, especially when using simple `fetch` calls.

## 2024-04-03 - Added aria-label to icon-only button
**Learning:** Found an icon-only button in `login.js` missing an `aria-label`, making it inaccessible to screen readers.
**Action:** Added `aria-label` to the button for better accessibility. Will continue to check for similar issues in other templates.

## 2024-05-18 - Native forms for 'Enter' key and dynamic alt attributes
**Learning:** For standalone JS search widgets, replacing `<div>` containers with native `<form>` elements natively enables 'Enter' key submission without explicit keydown listeners, greatly improving keyboard accessibility with minimal code. Also, dynamically generated UI elements (like carrier logos) often miss `alt` attributes, making them inaccessible.
**Action:** When implementing input widgets, use semantic `<form>` tags over divs and ensure all dynamically injected images have contextually relevant `alt` text.
