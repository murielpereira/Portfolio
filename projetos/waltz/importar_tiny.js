// importar_tiny.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const TOKEN = process.env.TINY_TOKEN;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function importarTodoOTiny() {
    console.log("⏳ Iniciando resgate completo de contatos do Tiny ERP...");
    
    let pagina = 1;
    let totalPaginas = 1;
    let salvos = 0;

    try {
        while (pagina <= totalPaginas) {
            console.log(`📄 Lendo página ${pagina} de ${totalPaginas}...`);
            
            const url = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resposta = await fetch(url);
            const dados = await resposta.json();

            if (dados.retorno && dados.retorno.status === 'OK') {
                totalPaginas = dados.retorno.numero_paginas; // Descobre quantas páginas existem na realidade
                
                for (const item of dados.retorno.contatos) {
                    const c = item.contato;
                    const tipos = JSON.stringify(c.tipos_contato || '').toLowerCase();
                    
                    // Só salva se for cliente
                    if (tipos.includes('cliente') && c.cpf_cnpj) {
                        const cpfLimpo = c.cpf_cnpj.replace(/\D/g, '');
                        const telefone = c.celular || c.fone || '-';
                        
                        await sql`
                            INSERT INTO clientes (cpf, nome, cidade, estado, telefone)
                            VALUES (${cpfLimpo}, ${c.nome}, ${c.cidade || '-'}, ${c.uf || '-'}, ${telefone})
                            ON CONFLICT (cpf) DO NOTHING;
                        `;
                        salvos++;
                    }
                }
            }
            pagina++;
            await delay(800); // Pausa para a API do Tiny não bloquear a gente
        }
        
        console.log(`✅ SUCESSO ABSOLUTO! O banco do Tiny agora possui ${salvos} clientes registrados na varredura.`);
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro fatal ao buscar Tiny:", erro);
        process.exit(1);
    }
}
importarTodoOTiny();