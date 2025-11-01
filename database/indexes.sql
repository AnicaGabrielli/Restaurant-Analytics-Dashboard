-- ========================================
-- ÍNDICES DE PERFORMANCE - MySQL (CORRIGIDO)
-- Restaurant Analytics Dashboard
-- ========================================

USE challenge_db;

-- Remove índices se já existirem (evita erro de duplicação)
DROP INDEX IF EXISTS idx_sales_date_status_store ON sales;
DROP INDEX IF EXISTS idx_sales_date_channel ON sales;
DROP INDEX IF EXISTS idx_sales_customer_date ON sales;
DROP INDEX IF EXISTS idx_sales_amount ON sales;
DROP INDEX IF EXISTS idx_product_sales_product_sale ON product_sales;
DROP INDEX IF EXISTS idx_product_sales_sale_product ON product_sales;
DROP INDEX IF EXISTS idx_item_product_sales_item ON item_product_sales;
DROP INDEX IF EXISTS idx_delivery_addresses_location ON delivery_addresses;
DROP INDEX IF EXISTS idx_delivery_addresses_coords ON delivery_addresses;
DROP INDEX IF EXISTS idx_customers_email ON customers;
DROP INDEX IF EXISTS idx_customers_created ON customers;
DROP INDEX IF EXISTS idx_products_name ON products;
DROP INDEX IF EXISTS idx_products_category ON products;
DROP INDEX IF EXISTS idx_items_name ON items;
DROP INDEX IF EXISTS idx_stores_active ON stores;
DROP INDEX IF EXISTS idx_channels_type ON channels;
DROP INDEX IF EXISTS idx_payments_sale_type ON payments;
DROP INDEX IF EXISTS idx_delivery_sales_status ON delivery_sales;

-- ===== SALES TABLE (CRÍTICO) =====
CREATE INDEX idx_sales_date_status_store ON sales(created_at DESC, sale_status_desc, store_id);
CREATE INDEX idx_sales_date_channel ON sales(created_at DESC, channel_id);
CREATE INDEX idx_sales_customer_date ON sales(customer_id, created_at DESC);
CREATE INDEX idx_sales_amount ON sales(total_amount, sale_status_desc);

-- ===== PRODUCT_SALES TABLE =====
CREATE INDEX idx_product_sales_product_sale ON product_sales(product_id, sale_id);
CREATE INDEX idx_product_sales_sale_product ON product_sales(sale_id, product_id);

-- ===== ITEM_PRODUCT_SALES TABLE =====
CREATE INDEX idx_item_product_sales_item ON item_product_sales(item_id, product_sale_id);

-- ===== DELIVERY_ADDRESSES TABLE =====
CREATE INDEX idx_delivery_addresses_location ON delivery_addresses(city, neighborhood, sale_id);
CREATE INDEX idx_delivery_addresses_coords ON delivery_addresses(latitude, longitude);

-- ===== CUSTOMERS TABLE =====
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created ON customers(created_at DESC);

-- ===== PRODUCTS TABLE =====
CREATE INDEX idx_products_name ON products(name(100));
CREATE INDEX idx_products_category ON products(category_id, deleted_at);

-- ===== ITEMS TABLE =====
CREATE INDEX idx_items_name ON items(name(100));

-- ===== STORES TABLE =====
CREATE INDEX idx_stores_active ON stores(is_active, city);

-- ===== CHANNELS TABLE =====
CREATE INDEX idx_channels_type ON channels(type, brand_id);

-- ===== PAYMENTS TABLE =====
CREATE INDEX idx_payments_sale_type ON payments(sale_id, payment_type_id);

-- ===== DELIVERY_SALES TABLE =====
CREATE INDEX idx_delivery_sales_status ON delivery_sales(status, sale_id);

-- ===== VERIFICAÇÃO DE ÍNDICES =====
SELECT 
    table_name AS 'Tabela',
    index_name AS 'Índice',
    GROUP_CONCAT(column_name ORDER BY seq_in_index) AS 'Colunas'
FROM information_schema.statistics
WHERE table_schema = 'challenge_db'
    AND table_name IN ('sales', 'product_sales', 'item_product_sales', 'customers', 'products')
GROUP BY table_name, index_name
ORDER BY table_name, index_name;

-- ===== ESTATÍSTICAS DE TAMANHO =====
SELECT 
    table_name AS 'Tabela',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Tamanho Total (MB)',
    ROUND((index_length / 1024 / 1024), 2) AS 'Tamanho Índices (MB)',
    ROUND((index_length / (data_length + index_length) * 100), 2) AS 'Índices (%)'
FROM information_schema.TABLES
WHERE table_schema = 'challenge_db'
ORDER BY (data_length + index_length) DESC
LIMIT 10;

-- ===== ANÁLISE DE QUERIES (Ativar slow query log se necessário) =====
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 2;
-- SHOW VARIABLES LIKE 'slow_query%';

SELECT '✅ Índices criados com sucesso!' AS Status;