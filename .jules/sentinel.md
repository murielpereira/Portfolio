## 2025-04-02 - [CRITICAL] Code Execution via eval()
**Vulnerability:** The calculator application (`projetos/calculadora/calculadora.js`) was using `eval()` to calculate mathematical expressions based on user input directly from the DOM without any sanitization.
**Learning:** This is a classic code execution / Cross-Site Scripting (XSS) vulnerability. An attacker could potentially inject malicious JavaScript code into the input field and execute it in the context of the user's browser. While this specific calculator might not be exposed to direct URL parameters, any user input passed to `eval()` is a severe risk.
**Prevention:** Never use `eval()` on unsanitized user input. For mathematical evaluations, use a safer alternative like the `Function` constructor combined with strict regex validation to ensure only numbers and valid mathematical operators are processed.

## 2025-04-03 - [CRITICAL] Hardcoded Session Secret
**Vulnerability:** The `server.js` file for the `waltz` project used a hardcoded fallback session secret (`'chave-fallback'`) when `CHAVE_SECRETA_SESSAO` was not set in the environment variables.
**Learning:** Using a predictable, hardcoded session secret allows attackers to easily forge session cookies and bypass authentication mechanisms, particularly if the environment variable is accidentally omitted during deployment. This constitutes a severe security gap.
**Prevention:** Never use hardcoded secrets for authentication or session management, even as fallbacks. Instead, fail securely by throwing an explicit error on application startup if critical secrets are missing, forcing the developer to provide them securely via the environment.
