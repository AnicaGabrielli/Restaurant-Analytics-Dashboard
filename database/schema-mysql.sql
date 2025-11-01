-- Restaurant Analytics Database - MySQL Version
-- Fixed syntax errors

CREATE DATABASE IF NOT EXISTS challenge_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE challenge_db;

-- Drop tables if exist (for fresh start)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS item_item_product_sales;
DROP TABLE IF EXISTS item_product_sales;
DROP TABLE IF EXISTS product_sales;
DROP TABLE IF EXISTS delivery_addresses;
DROP TABLE IF EXISTS delivery_sales;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS coupon_sales;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS payment_types;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS option_groups;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS sub_brands;
DROP TABLE IF EXISTS brands;
SET FOREIGN_KEY_CHECKS = 1;

-- Brands
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sub-brands
CREATE TABLE sub_brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB;

-- Stores
CREATE TABLE stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    sub_brand_id INT,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    district VARCHAR(100),
    address_street VARCHAR(200),
    address_number INT,
    zipcode VARCHAR(10),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    is_active BOOLEAN DEFAULT TRUE,
    is_own BOOLEAN DEFAULT FALSE,
    is_holding BOOLEAN DEFAULT FALSE,
    creation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id),
    INDEX idx_active (is_active),
    INDEX idx_city (city)
) ENGINE=InnoDB;

-- Channels
CREATE TABLE channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    type CHAR(1) CHECK (type IN ('P', 'D')),  -- P=Presencial, D=Delivery
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    sub_brand_id INT,
    name VARCHAR(200) NOT NULL,
    type CHAR(1) DEFAULT 'P',  -- P=Produto, I=Item
    pos_uuid VARCHAR(100),
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- Products
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    sub_brand_id INT,
    category_id INT,
    name VARCHAR(500) NOT NULL,
    pos_uuid VARCHAR(100),
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_category (category_id),
    INDEX idx_name (name(100))
) ENGINE=InnoDB;

-- Option Groups
CREATE TABLE option_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    sub_brand_id INT,
    category_id INT,
    name VARCHAR(500) NOT NULL,
    pos_uuid VARCHAR(100),
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- Items (complementos)
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    sub_brand_id INT,
    category_id INT,
    name VARCHAR(500) NOT NULL,
    pos_uuid VARCHAR(100),
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_name (name(100))
) ENGINE=InnoDB;

-- Customers
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    email VARCHAR(100),
    phone_number VARCHAR(50),
    cpf VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),
    store_id INT,
    sub_brand_id INT,
    registration_origin VARCHAR(20),
    agree_terms BOOLEAN DEFAULT FALSE,
    receive_promotions_email BOOLEAN DEFAULT FALSE,
    receive_promotions_sms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id),
    INDEX idx_email (email),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Payment Types
CREATE TABLE payment_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    description VARCHAR(100) NOT NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB;

-- Sales (núcleo)
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    sub_brand_id INT,
    customer_id INT,
    channel_id INT NOT NULL,
    
    cod_sale1 VARCHAR(100),
    cod_sale2 VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    customer_name VARCHAR(100),
    sale_status_desc VARCHAR(100) NOT NULL,
    
    -- Financial values
    total_amount_items DECIMAL(10,2) NOT NULL,
    total_discount DECIMAL(10,2) DEFAULT 0,
    total_increase DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    service_tax_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    value_paid DECIMAL(10,2) DEFAULT 0,
    
    -- Operational metrics
    production_seconds INT,
    delivery_seconds INT,
    people_quantity INT,
    
    -- Metadata
    discount_reason VARCHAR(300),
    increase_reason VARCHAR(300),
    origin VARCHAR(100) DEFAULT 'POS',
    
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    
    INDEX idx_created_status (created_at, sale_status_desc),
    INDEX idx_store (store_id),
    INDEX idx_channel (channel_id),
    INDEX idx_customer (customer_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Product Sales
CREATE TABLE product_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity FLOAT NOT NULL,
    base_price FLOAT NOT NULL,
    total_price FLOAT NOT NULL,
    observations VARCHAR(300),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_sale_product (sale_id, product_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- Item Product Sales (customizações)
CREATE TABLE item_product_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_sale_id INT NOT NULL,
    item_id INT NOT NULL,
    option_group_id INT,
    quantity FLOAT NOT NULL,
    additional_price FLOAT NOT NULL,
    price FLOAT NOT NULL,
    amount FLOAT DEFAULT 1,
    observations VARCHAR(300),
    FOREIGN KEY (product_sale_id) REFERENCES product_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (option_group_id) REFERENCES option_groups(id),
    INDEX idx_product_sale (product_sale_id),
    INDEX idx_item (item_id)
) ENGINE=InnoDB;

-- Item Item Product Sales (nested)
CREATE TABLE item_item_product_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_product_sale_id INT NOT NULL,
    item_id INT NOT NULL,
    option_group_id INT,
    quantity FLOAT NOT NULL,
    additional_price FLOAT NOT NULL,
    price FLOAT NOT NULL,
    amount FLOAT DEFAULT 1,
    FOREIGN KEY (item_product_sale_id) REFERENCES item_product_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (option_group_id) REFERENCES option_groups(id)
) ENGINE=InnoDB;

-- Delivery Sales
CREATE TABLE delivery_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    courier_id VARCHAR(100),
    courier_name VARCHAR(100),
    courier_phone VARCHAR(100),
    courier_type VARCHAR(100),
    delivered_by VARCHAR(100),
    delivery_type VARCHAR(100),
    status VARCHAR(100),
    delivery_fee FLOAT,
    courier_fee FLOAT,
    timing VARCHAR(100),
    mode VARCHAR(100),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    INDEX idx_sale (sale_id)
) ENGINE=InnoDB;

-- Delivery Addresses
CREATE TABLE delivery_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    delivery_sale_id INT,
    street VARCHAR(200),
    number VARCHAR(20),
    complement VARCHAR(200),
    formatted_address VARCHAR(500),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    reference VARCHAR(300),
    latitude FLOAT,
    longitude FLOAT,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_sale_id) REFERENCES delivery_sales(id) ON DELETE CASCADE,
    INDEX idx_sale (sale_id),
    INDEX idx_city (city),
    INDEX idx_neighborhood (neighborhood)
) ENGINE=InnoDB;

-- Payments
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    payment_type_id INT,
    value DECIMAL(10,2) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    description VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'BRL',
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_type_id) REFERENCES payment_types(id),
    INDEX idx_sale (sale_id),
    INDEX idx_type (payment_type_id)
) ENGINE=InnoDB;

-- Coupons
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(1),  -- 'p' percentage, 'f' fixed
    discount_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB;

-- Coupon Sales
CREATE TABLE coupon_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    coupon_id INT,
    value FLOAT,
    target VARCHAR(100),
    sponsorship VARCHAR(100),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
) ENGINE=InnoDB;

-- Insert initial brand
INSERT INTO brands (name) VALUES ('Challenge Restaurant Group');