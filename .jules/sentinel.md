## 2025-04-02 - [CRITICAL] Code Execution via eval()
**Vulnerability:** The calculator application (`projetos/calculadora/calculadora.js`) was using `eval()` to calculate mathematical expressions based on user input directly from the DOM without any sanitization.
**Learning:** This is a classic code execution / Cross-Site Scripting (XSS) vulnerability. An attacker could potentially inject malicious JavaScript code into the input field and execute it in the context of the user's browser. While this specific calculator might not be exposed to direct URL parameters, any user input passed to `eval()` is a severe risk.
**Prevention:** Never use `eval()` on unsanitized user input. For mathematical evaluations, use a safer alternative like the `Function` constructor combined with strict regex validation to ensure only numbers and valid mathematical operators are processed.

## 2025-04-06 - [CRITICAL] Hardcoded Session Secret Fallback
**Vulnerability:** `projetos/waltz/server.js` used an insecure fallback `|| 'chave-fallback'` for the session secret used to sign session cookies. This means if `CHAVE_SECRETA_SESSAO` environment variable wasn't set, all instances would use the same easily guessable secret, allowing session hijacking.
**Learning:** Defaulting to a hardcoded string when an environment variable is missing guarantees that misconfigured instances are trivially vulnerable. This is especially dangerous for authentication/session configuration where confidentiality and integrity are crucial.
**Prevention:** Always implement a "fail-secure" pattern for critical configurations. If a secret is missing, do not start the application; throw a critical error and exit (`process.exit(1)`) so the deployment fails visibly rather than running insecurely.
