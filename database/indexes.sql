-- ========================================
-- ÍNDICES DE PERFORMANCE - MySQL
-- Restaurant Analytics Dashboard
-- ========================================
-- Execute após popular o banco com dados
-- Estes índices otimizam queries para milhões de registros

USE challenge_db;

-- ===== SALES TABLE =====
-- Índice composto para filtros mais comuns
CREATE INDEX idx_sales_date_status_store ON sales(created_at DESC, sale_status_desc, store_id);

-- Índice para agregações por período
CREATE INDEX idx_sales_date_channel ON sales(created_at DESC, channel_id);

-- Índice para análise de clientes
CREATE INDEX idx_sales_customer_date ON sales(customer_id, created_at DESC) 
WHERE customer_id IS NOT NULL;

-- Índice para valores
CREATE INDEX idx_sales_amount ON sales(total_amount, sale_status_desc);

-- ===== PRODUCT_SALES TABLE =====
-- Índice para produtos mais vendidos
CREATE INDEX idx_product_sales_product_sale ON product_sales(product_id, sale_id);

-- Índice para análise temporal de produtos
CREATE INDEX idx_product_sales_sale_product ON product_sales(sale_id, product_id);

-- ===== ITEM_PRODUCT_SALES TABLE =====
-- Índice para itens mais adicionados
CREATE INDEX idx_item_product_sales_item ON item_product_sales(item_id, product_sale_id);

-- ===== DELIVERY_ADDRESSES TABLE =====
-- Índice para análise geográfica
CREATE INDEX idx_delivery_addresses_location ON delivery_addresses(city, neighborhood, sale_id);

-- Índice para coordenadas (futuras análises espaciais)
CREATE INDEX idx_delivery_addresses_coords ON delivery_addresses(latitude, longitude);

-- ===== CUSTOMERS TABLE =====
-- Índice para busca por email
CREATE INDEX idx_customers_email ON customers(email);

-- Índice para clientes ativos por data
CREATE INDEX idx_customers_created ON customers(created_at DESC);

-- ===== PRODUCTS TABLE =====
-- Índice para busca por nome
CREATE INDEX idx_products_name ON products(name(100));

-- Índice por categoria
CREATE INDEX idx_products_category ON products(category_id, deleted_at);

-- ===== ITEMS TABLE =====
-- Índice para busca por nome
CREATE INDEX idx_items_name ON items(name(100));

-- ===== STORES TABLE =====
-- Índice para lojas ativas
CREATE INDEX idx_stores_active ON stores(is_active, city);

-- ===== CHANNELS TABLE =====
-- Índice por tipo
CREATE INDEX idx_channels_type ON channels(type, brand_id);

-- ===== PAYMENTS TABLE =====
-- Índice para análise de pagamentos
CREATE INDEX idx_payments_sale_type ON payments(sale_id, payment_type_id);

-- ===== DELIVERY_SALES TABLE =====
-- Índice para análise de entregas
CREATE INDEX idx_delivery_sales_status ON delivery_sales(status, sale_id);

-- ===== STATISTICS (para cache de agregações) =====
-- Análise de queries lentas
SHOW VARIABLES LIKE 'slow_query_log';

-- Verificar tamanho dos índices
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
    ROUND((index_length / 1024 / 1024), 2) AS 'Index Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'challenge_db'
ORDER BY (data_length + index_length) DESC;

-- ===== QUERY OPTIMIZATION HINTS =====
-- Use EXPLAIN ANALYZE nas queries críticas:
-- EXPLAIN ANALYZE SELECT * FROM sales WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Force index quando necessário:
-- SELECT * FROM sales FORCE INDEX (idx_sales_date_status_store) WHERE ...;

-- ===== PARTICIONAMENTO (opcional, para tabelas gigantes) =====
-- Particionar sales por data (requer ALTER TABLE)
-- ALTER TABLE sales PARTITION BY RANGE (YEAR(created_at)) (
--     PARTITION p2023 VALUES LESS THAN (2024),
--     PARTITION p2024 VALUES LESS THAN (2025),
--     PARTITION p2025 VALUES LESS THAN (2026),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- ===== MAINTENANCE =====
-- Executar periodicamente para otimizar índices
-- OPTIMIZE TABLE sales;
-- ANALYZE TABLE sales;

-- Verificar fragmentação
SELECT 
    table_name,
    ROUND(data_length / 1024 / 1024, 2) AS 'Data (MB)',
    ROUND(data_free / 1024 / 1024, 2) AS 'Free (MB)',
    ROUND((data_free / data_length) * 100, 2) AS 'Fragmentation %'
FROM information_schema.TABLES
WHERE table_schema = 'challenge_db' 
    AND data_free > 0
ORDER BY data_free DESC;