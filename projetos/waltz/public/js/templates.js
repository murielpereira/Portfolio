import { getTemplateLogin } from './templates/login.js';
import { getSidebar, getTopbar, getDrawer } from './templates/layout.js';
import { getAbaConfig } from './templates/aba-config.js';
import { getAbaDash } from './templates/aba-dash.js';
import { getAbaClientes } from './templates/aba-clientes.js';
import { getAbaPedidos } from './templates/aba-pedidos.js';
import { getAbaRfm } from './templates/aba-rfm.js';
import { getAbaCep } from './templates/aba-cep.js';
import { getAbaWhatsapp } from './templates/aba-whatsapp.js';
import { getAbaEmail } from './templates/aba-email.js';

export { getTemplateLogin };

export function getTemplatePainel() {
    return `
    <div class="dashboard-wrapper">
        ${getSidebar()}

        <main class="main-content">
            ${getTopbar()}

            <div class="page-content-wrapper" id="dashboard-content-area">
                ${getAbaConfig()}
                ${getAbaDash()}
                ${getAbaClientes()}
                ${getAbaPedidos()}
                ${getAbaEmail()}
                ${getAbaWhatsapp()}
                ${getAbaRfm()}
                ${getAbaCep()}
            </div>
            
            ${getDrawer()}
        </main>
    </div>`;
}