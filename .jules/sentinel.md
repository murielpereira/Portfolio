## 2025-04-02 - [CRITICAL] Code Execution via eval()
**Vulnerability:** The calculator application (`projetos/calculadora/calculadora.js`) was using `eval()` to calculate mathematical expressions based on user input directly from the DOM without any sanitization.
**Learning:** This is a classic code execution / Cross-Site Scripting (XSS) vulnerability. An attacker could potentially inject malicious JavaScript code into the input field and execute it in the context of the user's browser. While this specific calculator might not be exposed to direct URL parameters, any user input passed to `eval()` is a severe risk.
**Prevention:** Never use `eval()` on unsanitized user input. For mathematical evaluations, use a safer alternative like the `Function` constructor combined with strict regex validation to ensure only numbers and valid mathematical operators are processed.

## 2025-04-05 - [CRITICAL] Insecure Session Key Fallback
**Vulnerability:** The Node.js application (`projetos/waltz/server.js`) was using a predictable hardcoded string (`'chave-fallback'`) as a fallback for the cookie session secret if the environment variable `CHAVE_SECRETA_SESSAO` was missing.
**Learning:** Hardcoded cryptographic secrets allow an attacker to forge session cookies, leading to full authorization bypass if the application is ever deployed without the environment variable configured.
**Prevention:** Implement a "fail-secure" architecture. The application must refuse to start (`process.exit(1)`) if critical security configuration like session secrets are missing, rather than quietly falling back to an insecure default.
