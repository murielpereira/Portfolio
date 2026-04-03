export function getTemplateLogin() {
    return `
    <div class="login-bg">
        <div class="glass-card">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="./logo.png" alt="Waltz" style="height: 50px; margin-bottom: 15px; border-radius: 8px; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
                <p style="color: #e2e8f0; font-size: 14px; margin: 0;">Acesse sua conta para continuar</p>
            </div>
            <form id="form-login">
                <div style="margin-bottom: 20px;">
                    <label for="usuario" style="display: block; margin-bottom: 8px; font-weight: 600; color: #f8fafc; font-size: 13px;">E-mail</label>
                    <input type="text" id="usuario" name="usuario" placeholder="seu@email.com" class="glass-input" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="senha" style="display: block; margin-bottom: 8px; font-weight: 600; color: #f8fafc; font-size: 13px;">Senha</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="senha" name="senha" placeholder="••••••••" class="glass-input" required>
                        <button type="button" id="btn-mostrar-senha" aria-label="Mostrar ou ocultar senha" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #cbd5e1; display: flex;"><span class="material-symbols-outlined" id="icone-senha" style="font-size: 20px;">visibility</span></button>
                    </div>
                </div>
                <div style="text-align: right; margin-bottom: 30px;"><a href="#" style="color: #cbd5e1; font-size: 13px; text-decoration: none;">Esqueceu a senha?</a></div>
                <button type="submit" id="btn-login-submit" class="glass-btn">Entrar</button>
            </form>
        </div>
    </div>`;
}