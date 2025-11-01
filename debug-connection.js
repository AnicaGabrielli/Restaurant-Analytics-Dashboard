// ========== debug-connection.js ==========
// Script para diagnosticar problemas de conexão MySQL

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('🔍 DIAGNÓSTICO DE CONEXÃO MYSQL\n');
console.log('='.repeat(60));

// Função de teste
async function testConnection() {
    console.log('\n📋 CONFIGURAÇÕES:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'challenge_db'}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '****' : '(vazio)'}`);

    // Teste 1: Conexão básica
    console.log('\n🔄 TESTE 1: Conexão Básica');
    console.log('-'.repeat(60));
    
    try {
        console.log('   Tentando conectar...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            connectTimeout: 10000
        });
        
        console.log('   ✅ Conexão estabelecida com sucesso!');
        
        // Teste 2: Ping
        console.log('\n🔄 TESTE 2: Ping');
        console.log('-'.repeat(60));
        console.log('   Enviando ping...');
        await connection.ping();
        console.log('   ✅ Ping bem-sucedido!');
        
        // Teste 3: Query simples
        console.log('\n🔄 TESTE 3: Query Simples');
        console.log('-'.repeat(60));
        console.log('   Executando SELECT 1...');
        const [rows] = await connection.query('SELECT 1 as test, NOW() as now, VERSION() as version');
        console.log('   ✅ Query executada!');
        console.log(`   Resultado: test=${rows[0].test}, versão=${rows[0].version}`);
        
        // Teste 4: Database específico
        console.log('\n🔄 TESTE 4: Database Específico');
        console.log('-'.repeat(60));
        const dbName = process.env.DB_NAME || 'challenge_db';
        
        try {
            console.log(`   Tentando usar database: ${dbName}`);
            await connection.query(`USE ${dbName}`);
            console.log('   ✅ Database acessível!');
            
            // Teste 5: Tabelas
            console.log('\n🔄 TESTE 5: Verificando Tabelas');
            console.log('-'.repeat(60));
            const [tables] = await connection.query('SHOW TABLES');
            console.log(`   ✅ Database contém ${tables.length} tabelas:`);
            tables.slice(0, 10).forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`      - ${tableName}`);
            });
            if (tables.length > 10) {
                console.log(`      ... e mais ${tables.length - 10} tabelas`);
            }
            
            // Teste 6: Contagem de registros
            console.log('\n🔄 TESTE 6: Contando Registros');
            console.log('-'.repeat(60));
            try {
                const [salesCount] = await connection.query('SELECT COUNT(*) as count FROM sales');
                console.log(`   ✅ Sales: ${salesCount[0].count.toLocaleString('pt-BR')} registros`);
                
                const [storesCount] = await connection.query('SELECT COUNT(*) as count FROM stores');
                console.log(`   ✅ Stores: ${storesCount[0].count.toLocaleString('pt-BR')} registros`);
                
                const [productsCount] = await connection.query('SELECT COUNT(*) as count FROM products');
                console.log(`   ✅ Products: ${productsCount[0].count.toLocaleString('pt-BR')} registros`);
            } catch (error) {
                console.log(`   ⚠️  Não foi possível contar registros: ${error.message}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Database não encontrado: ${dbName}`);
            console.log(`   💡 Crie o database com:`);
            console.log(`      mysql -u root -p -e "CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
            console.log(`      mysql -u root -p ${dbName} < database/schema-mysql.sql`);
        }
        
        // Teste 7: Pool
        console.log('\n🔄 TESTE 7: Connection Pool');
        console.log('-'.repeat(60));
        console.log('   Criando pool...');
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName,
            connectionLimit: 10,
            waitForConnections: true,
            queueLimit: 0,
            connectTimeout: 10000
        });
        
        console.log('   Testando pool...');
        const poolConnection = await pool.getConnection();
        await poolConnection.ping();
        poolConnection.release();
        console.log('   ✅ Pool funcionando!');
        
        await pool.end();
        await connection.end();
        
        // Resumo final
        console.log('\n' + '='.repeat(60));
        console.log('✅ TODOS OS TESTES PASSARAM!');
        console.log('='.repeat(60));
        console.log('\n💡 Seu ambiente está configurado corretamente.');
        console.log('   Você pode iniciar o servidor com: npm start\n');
        
    } catch (error) {
        console.log('\n❌ ERRO DETECTADO!');
        console.log('='.repeat(60));
        console.log(`Tipo: ${error.code || 'UNKNOWN'}`);
        console.log(`Mensagem: ${error.message}`);
        console.log('\n💡 DIAGNÓSTICO:');
        
        if (error.code === 'ECONNREFUSED') {
            console.log('   ❌ MySQL não está rodando ou não está acessível');
            console.log('\n   SOLUÇÕES:');
            console.log('   1. Verifique se o MySQL está rodando:');
            console.log('      sudo service mysql status');
            console.log('\n   2. Inicie o MySQL:');
            console.log('      sudo service mysql start');
            console.log('\n   3. Verifique a porta no MySQL:');
            console.log('      sudo netstat -tlnp | grep mysql');
            
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('   ❌ Credenciais incorretas');
            console.log('\n   SOLUÇÕES:');
            console.log('   1. Verifique usuário e senha no arquivo .env');
            console.log('   2. Teste manualmente:');
            console.log(`      mysql -u ${process.env.DB_USER || 'root'} -p`);
            console.log('\n   3. Recrie o usuário se necessário:');
            console.log('      mysql -u root -p');
            console.log('      CREATE USER \'seu_usuario\'@\'localhost\' IDENTIFIED BY \'sua_senha\';');
            console.log('      GRANT ALL PRIVILEGES ON challenge_db.* TO \'seu_usuario\'@\'localhost\';');
            console.log('      FLUSH PRIVILEGES;');
            
        } else if (error.code === 'ETIMEDOUT') {
            console.log('   ❌ Timeout de conexão');
            console.log('\n   SOLUÇÕES:');
            console.log('   1. Verifique firewall');
            console.log('   2. Verifique configuração de bind-address no MySQL');
            console.log('   3. Aumente o timeout no .env (CONNECTION_TIMEOUT=30000)');
            
        } else if (error.code === 'ENOTFOUND') {
            console.log('   ❌ Host não encontrado');
            console.log('\n   SOLUÇÕES:');
            console.log('   1. Verifique DB_HOST no .env (deve ser \'localhost\' ou IP válido)');
            console.log('   2. Verifique DNS/hosts file');
            
        } else {
            console.log('   ❌ Erro desconhecido');
            console.log('\n   Stack trace:');
            console.log(error.stack);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('❌ CONFIGURAÇÃO INCOMPLETA');
        console.log('='.repeat(60));
        console.log('\nResolva os problemas acima antes de iniciar o servidor.\n');
        
        process.exit(1);
    }
}

// Executa diagnóstico
testConnection().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
});