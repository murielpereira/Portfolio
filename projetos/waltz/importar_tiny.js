// importar_tiny.js
require('dotenv').config();
const { sql } = require('@vercel/postgres');

const TOKEN = process.env.TINY_TOKEN;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function importarTodoOTiny() {
    console.log("⏳ Iniciando resgate e atualização completa de contatos do Tiny ERP...");
    
    let pagina = 1;
    let totalPaginas = 1;
    let salvos = 0;
    let ignorados = 0;

    try {
        while (pagina <= totalPaginas) {
            console.log(`📄 Lendo página ${pagina} de ${totalPaginas}...`);
            
            const url = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${TOKEN}&formato=JSON&pagina=${pagina}`;
            const resposta = await fetch(url);
            const dados = await resposta.json();

            if (dados.retorno && dados.retorno.status === 'OK') {
                totalPaginas = dados.retorno.numero_paginas; 
                
                for (const item of dados.retorno.contatos) {
                    const c = item.contato;
                    const tipos = JSON.stringify(c.tipos_contato || '').toLowerCase();
                    
                    // Lógica Flexível: Se tiver um tipo escrito e NÃO for cliente/comprador, é porque é fornecedor ou transportadora. Então pula.
                    if (tipos !== '""' && !tipos.includes('cliente') && !tipos.includes('comprador')) {
                        ignorados++;
                        continue; 
                    }

                    // Apenas prossegue se o contato tiver CPF ou CNPJ
                    if (c.cpf_cnpj) {
                        const cpfLimpo = c.cpf_cnpj.replace(/\D/g, '');
                        
                        // Garante que o CPF não ficou vazio após limpar os pontos e traços
                        if (cpfLimpo.length > 0) {
                            const telefone = c.celular || c.fone || '-';
                            
                            // Usamos UPSERT (DO UPDATE) para atualizar os dados dos 2044 clientes que você já tinha
                            await sql`
                                INSERT INTO clientes (cpf, nome, cidade, estado, telefone)
                                VALUES (${cpfLimpo}, ${c.nome}, ${c.cidade || '-'}, ${c.uf || '-'}, ${telefone})
                                ON CONFLICT (cpf) DO UPDATE SET 
                                    nome = EXCLUDED.nome,
                                    cidade = EXCLUDED.cidade,
                                    estado = EXCLUDED.estado,
                                    telefone = EXCLUDED.telefone;
                            `;
                            salvos++;
                        } else {
                            ignorados++;
                        }
                    } else {
                        // Se não tem CPF, nós ignoramos pois nosso banco exige o CPF como chave principal
                        ignorados++;
                    }
                }
            } else {
                console.log(`⚠️ Aviso na página ${pagina}: A API do Tiny não retornou dados.`);
            }
            pagina++;
            await delay(800); // Pausa de segurança para não tomar bloqueio da API
        }
        
        console.log(`\n✅ SUCESSO ABSOLUTO!`);
        console.log(`📊 Clientes Inseridos/Atualizados: ${salvos}`);
        console.log(`🚫 Contatos Ignorados (Sem CPF ou Fornecedores): ${ignorados}`);
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro fatal ao buscar Tiny:", erro);
        process.exit(1);
    }
}

importarTodoOTiny();