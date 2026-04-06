require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

// 🚨 Fail-secure: Ensure session secret is provided
if (!process.env.CHAVE_SECRETA_SESSAO) {
    console.error('CRITICAL ERROR: CHAVE_SECRETA_SESSAO environment variable is missing.');
    console.error('The server cannot start without a secure session secret.');
    process.exit(1);
}

const app = express();

// 1. Configurações Básicas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
    name: 'sessao-automacao',
    keys: [process.env.CHAVE_SECRETA_SESSAO],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, 
    sameSite: 'lax' 
}));

// 2. Importando os nossos novos Módulos Separados
const rotasSistema = require('./routes/sistema');
const rotasWhatsApp = require('./routes/whatsapp');
const rotasPedidos = require('./routes/pedidos');
const rotasClientes = require('./routes/clientes');
const rotasLogistica = require('./routes/logistica');

// 3. Conectando os Módulos ao Servidor
app.use('/', rotasSistema);
app.use('/', rotasWhatsApp);
app.use('/', rotasPedidos);
app.use('/', rotasClientes);
app.use('/', rotasLogistica);

// 4. Ligar os Motores
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta: ${PORT} com arquitetura modularizada!`));

module.exports = app;