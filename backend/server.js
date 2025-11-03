import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('🍔 Restaurant Analytics Server');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/index.html`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`📝 Health Check: http://localhost:${PORT}/api/health`);
  console.log('\n💡 Ctrl+C to stop the server');
});