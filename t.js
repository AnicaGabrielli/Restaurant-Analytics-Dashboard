import mysql from 'mysql2/promise';

async function testConnection() {
  console.log('🔍 Testando conexão com MySQL...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'challenge_db',
      port: 3306
    });
    
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Testar tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tabelas encontradas:', tables.length);
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });
    
    console.log('\n📈 Contagem de registros:');
    
    // Contar vendas
    const [sales] = await connection.execute('SELECT COUNT(*) as count FROM sales');
    console.log('  - Sales:', sales[0].count);
    
    // Contar produtos
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log('  - Products:', products[0].count);
    
    // Contar lojas
    const [stores] = await connection.execute('SELECT COUNT(*) as count FROM stores');
    console.log('  - Stores:', stores[0].count);
    
    // Contar canais
    const [channels] = await connection.execute('SELECT COUNT(*) as count FROM channels');
    console.log('  - Channels:', channels[0].count);
    
    // Testar query de métricas
    console.log('\n💰 Testando query de métricas...');
    const [metrics] = await connection.execute(`
      SELECT 
        COUNT(*) as total_sales,
        SUM(CASE WHEN sale_status_desc = 'COMPLETED' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN sale_status_desc = 'COMPLETED' THEN total_amount ELSE NULL END) as avg_ticket
      FROM sales
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    console.log('  Total vendas (30d):', metrics[0].total_sales);
    console.log('  Receita total:', metrics[0].total_revenue);
    console.log('  Ticket médio:', metrics[0].avg_ticket);
    
    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro na conexão:', error.message);
    console.error('\n📋 Detalhes:', error);
    
    console.log('\n💡 Sugestões:');
    console.log('  1. Verifique se o MySQL está rodando');
    console.log('  2. Confirme as credenciais (user: root, password: 123456)');
    console.log('  3. Certifique-se que o banco "challenge_db" existe');
    console.log('  4. Verifique se os dados foram importados');
  }
}

testConnection();