## 2025-04-02 - [CRITICAL] Code Execution via eval()
**Vulnerability:** The calculator application (`projetos/calculadora/calculadora.js`) was using `eval()` to calculate mathematical expressions based on user input directly from the DOM without any sanitization.
**Learning:** This is a classic code execution / Cross-Site Scripting (XSS) vulnerability. An attacker could potentially inject malicious JavaScript code into the input field and execute it in the context of the user's browser. While this specific calculator might not be exposed to direct URL parameters, any user input passed to `eval()` is a severe risk.
**Prevention:** Never use `eval()` on unsanitized user input. For mathematical evaluations, use a safer alternative like the `Function` constructor combined with strict regex validation to ensure only numbers and valid mathematical operators are processed.

## 2025-04-02 - [CRITICAL] Hardcoded Session Secret
**Vulnerability:** The application server (`projetos/waltz/server.js`) was using a hardcoded fallback secret ('chave-fallback') for cookie-session encryption if the environment variable `CHAVE_SECRETA_SESSAO` was missing.
**Learning:** This is a severe security risk. Hardcoded secrets in source code can easily be leaked through version control systems. If a predictable or easily guessable secret is used, attackers can forge session cookies and impersonate arbitrary users or gain unauthorized access to the application.
**Prevention:** Never use hardcoded fallback secrets. Applications should fail securely (e.g., crash on startup) if critical security configuration is missing, ensuring that the issue is immediately noticeable and fixed before deployment. Use environment variables for sensitive configuration.
