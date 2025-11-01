#!/usr/bin/env python3
"""
Restaurant Analytics - MySQL Data Generator
Adaptado do script original para MySQL
"""

import random
import argparse
from datetime import datetime, timedelta
from decimal import Decimal
import pymysql
from pymysql.err import MySQLError as Error
from faker import Faker

fake = Faker('pt_BR')

# Configurações
BRAND_ID = 1
SALES_STATUS = ['COMPLETED', 'CANCELLED']
STATUS_WEIGHTS = [0.95, 0.05]
CATEGORIES_PRODUCTS = ['Burgers', 'Pizzas', 'Pratos', 'Combos', 'Sobremesas', 'Bebidas']
CATEGORIES_ITEMS = ['Complementos', 'Molhos', 'Adicionais']

PRODUCT_PREFIXES = {
    'Burgers': ['X-Burger', 'Cheeseburger', 'Bacon Burger', 'Double Burger', 'Veggie Burger'],
    'Pizzas': ['Pizza Margherita', 'Pizza Calabresa', 'Pizza 4 Queijos', 'Pizza Portuguesa', 'Pizza Frango'],
    'Pratos': ['Prato Executivo', 'Filé', 'Frango Grelhado', 'Lasanha', 'Risoto'],
    'Combos': ['Combo Família', 'Combo Individual', 'Combo Duplo', 'Combo Kids', 'Combo Executivo'],
    'Sobremesas': ['Brownie', 'Pudim', 'Sorvete', 'Petit Gateau', 'Torta'],
    'Bebidas': ['Refrigerante', 'Suco', 'Água', 'Cerveja', 'Vinho']
}

ITEM_NAMES = {
    'Complementos': ['Bacon', 'Queijo Cheddar', 'Queijo Mussarela', 'Ovo', 'Alface', 'Tomate', 
                     'Cebola', 'Picles', 'Jalapeño', 'Cogumelos', 'Abacaxi', 'Catupiry'],
    'Molhos': ['Molho Barbecue', 'Molho Mostarda', 'Molho Especial', 'Maionese', 'Ketchup', 
               'Molho Picante', 'Molho Ranch', 'Molho Tártaro'],
    'Adicionais': ['Batata Frita', 'Onion Rings', 'Nuggets', 'Salada', 'Arroz', 'Feijão',
                   'Farofa', 'Vinagrete']
}

HOURLY_WEIGHTS = {
    range(0, 6): 0.02, range(6, 11): 0.08, range(11, 15): 0.35,
    range(15, 19): 0.10, range(19, 23): 0.40, range(23, 24): 0.05
}

WEEKDAY_MULT = [0.8, 0.9, 0.95, 1.0, 1.3, 1.5, 1.4]

CHANNELS = [
    ('Presencial', 'P', 0.40, 0),
    ('iFood', 'D', 0.30, 27),
    ('Rappi', 'D', 0.15, 25),
    ('Uber Eats', 'D', 0.08, 30),
    ('WhatsApp', 'D', 0.05, 0),
    ('App Próprio', 'D', 0.02, 0)
]

PAYMENT_TYPES_LIST = [
    'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 
    'PIX', 'Vale Refeição', 'Vale Alimentação'
]

DISCOUNT_REASONS = [
    'Cupom de desconto', 'Promoção do dia', 'Cliente fidelidade',
    'Desconto gerente', 'Primeira compra', 'Aniversário'
]

DELIVERY_TYPES = ['DELIVERY', 'TAKEOUT', 'INDOOR']
COURIER_TYPES = ['PLATFORM', 'OWN', 'THIRD_PARTY']


def get_db_connection(host, user, password, database):
    """Cria conexão com MySQL"""
    try:
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        return connection
    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")
        return None


def get_hour_weight(hour):
    for hour_range, weight in HOURLY_WEIGHTS.items():
        if hour in hour_range:
            return weight
    return 0.01


def setup_base_data(conn):
    """Cria dados base"""
    print("Configurando dados base...")
    cursor = conn.cursor()
    
    # Sub-brands
    sub_brands = ['Challenge Burger', 'Challenge Pizza', 'Challenge Sushi']
    sub_brand_ids = []
    for sb in sub_brands:
        cursor.execute(
            "INSERT INTO sub_brands (brand_id, name) VALUES (%s, %s)",
            (BRAND_ID, sb)
        )
        sub_brand_ids.append(cursor.lastrowid)
    
    # Channels
    channel_ids = []
    for name, ch_type, weight, commission in CHANNELS:
        cursor.execute("""
            INSERT INTO channels (brand_id, name, description, type)
            VALUES (%s, %s, %s, %s)
        """, (BRAND_ID, name, f'Canal {name}', ch_type))
        channel_ids.append({
            'id': cursor.lastrowid,
            'name': name, 
            'type': ch_type, 
            'weight': weight
        })
    
    # Payment types
    for pt in PAYMENT_TYPES_LIST:
        cursor.execute(
            "INSERT INTO payment_types (brand_id, description) VALUES (%s, %s)",
            (BRAND_ID, pt)
        )
    
    conn.commit()
    print(f"✓ Dados base: {len(sub_brand_ids)} sub-brands, {len(channel_ids)} canais")
    return sub_brand_ids, channel_ids


def generate_stores(conn, sub_brand_ids, num_stores=50):
    """Gera lojas"""
    print(f"Gerando {num_stores} lojas...")
    cursor = conn.cursor()
    stores = []
    
    cities = [fake.city() for _ in range(20)]
    
    for i in range(num_stores):
        city = random.choice(cities)
        sub_brand_id = random.choice(sub_brand_ids)
        is_active = random.random() > 0.1
        is_own = random.random() > 0.7
        
        base_lat = -23.5 + random.uniform(-2, 2)
        base_long = -46.6 + random.uniform(-3, 3)
        
        cursor.execute("""
            INSERT INTO stores (
                brand_id, sub_brand_id, name, city, state, 
                district, address_street, address_number,
                latitude, longitude, is_active, is_own,
                creation_date, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            BRAND_ID, sub_brand_id,
            f"{fake.company()} - {city}",
            city, fake.estado_sigla(), fake.bairro(),
            fake.street_name(), random.randint(10, 9999),
            round(base_lat, 6), round(base_long, 6),
            is_active, is_own,
            fake.date_between(start_date='-2y', end_date='-6m'),
            datetime.now() - timedelta(days=random.randint(180, 720))
        ))
        stores.append(cursor.lastrowid)
    
    conn.commit()
    print(f"✓ {len(stores)} lojas criadas")
    return stores


def generate_products_and_items(conn, sub_brand_ids, num_products=500, num_items=200):
    """Gera produtos e itens"""
    print(f"Gerando {num_products} produtos e {num_items} itens...")
    cursor = conn.cursor()
    
    products = []
    items = []
    option_groups = []
    
    # Categorias de produtos
    for cat_name in CATEGORIES_PRODUCTS:
        cursor.execute("""
            INSERT INTO categories (brand_id, name, type)
            VALUES (%s, %s, 'P')
        """, (BRAND_ID, cat_name))
        cat_id = cursor.lastrowid
        
        prefixes = PRODUCT_PREFIXES.get(cat_name, [cat_name])
        products_to_create = num_products // len(CATEGORIES_PRODUCTS)
        
        for i in range(products_to_create):
            sub_brand_id = random.choice(sub_brand_ids)
            prefix = random.choice(prefixes)
            
            if i % 3 == 0:
                name = f"{prefix} P #{i+1:03d}"
            elif i % 3 == 1:
                name = f"{prefix} M #{i+1:03d}"
            else:
                name = f"{prefix} G #{i+1:03d}"
            
            cursor.execute("""
                INSERT INTO products (brand_id, sub_brand_id, category_id, name, pos_uuid)
                VALUES (%s, %s, %s, %s, %s)
            """, (BRAND_ID, sub_brand_id, cat_id, name, f"prod_{cat_id}_{i}"))
            
            products.append({
                'id': cursor.lastrowid,
                'name': name,
                'category': cat_name,
                'base_price': round(random.uniform(15, 120), 2),
                'popularity': random.betavariate(2, 5),
                'has_customization': random.random() > 0.4
            })
    
    # Categorias de itens
    for cat_name in CATEGORIES_ITEMS:
        cursor.execute("""
            INSERT INTO categories (brand_id, name, type)
            VALUES (%s, %s, 'I')
        """, (BRAND_ID, cat_name))
        cat_id = cursor.lastrowid
        
        item_names_list = ITEM_NAMES.get(cat_name, [])
        
        if item_names_list:
            for item_name in item_names_list:
                sub_brand_id = random.choice(sub_brand_ids)
                
                cursor.execute("""
                    INSERT INTO items (brand_id, sub_brand_id, category_id, name, pos_uuid)
                    VALUES (%s, %s, %s, %s, %s)
                """, (BRAND_ID, sub_brand_id, cat_id, item_name, f"item_{cat_id}_{item_name[:10]}"))
                
                items.append({
                    'id': cursor.lastrowid,
                    'name': item_name,
                    'price': round(random.uniform(2, 15), 2)
                })
    
    # Option groups
    option_group_names = ['Adicionais', 'Remover', 'Ponto da Carne', 'Tamanho']
    for og_name in option_group_names:
        cursor.execute("""
            INSERT INTO option_groups (brand_id, name)
            VALUES (%s, %s)
        """, (BRAND_ID, og_name))
        option_groups.append(cursor.lastrowid)
    
    conn.commit()
    print(f"✓ {len(products)} produtos, {len(items)} itens, {len(option_groups)} option groups")
    return products, items, option_groups


def generate_customers(conn, num_customers=10000):
    """Gera clientes"""
    print(f"Gerando {num_customers} clientes...")
    cursor = conn.cursor()
    
    for _ in range(num_customers):
        cursor.execute("""
            INSERT INTO customers (
                customer_name, email, phone_number, cpf, birth_date, gender,
                agree_terms, receive_promotions_email, registration_origin, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            fake.name(), fake.email(), fake.phone_number(), fake.cpf(),
            fake.date_of_birth(minimum_age=18, maximum_age=75),
            random.choice(['M', 'F', 'NB', 'O']),
            random.choice([True, False]),
            random.choice([True, False, False]),
            random.choice(['qr_code', 'link', 'balcony', 'pos']),
            datetime.now() - timedelta(days=random.randint(0, 720))
        ))
    
    cursor.execute("SELECT id FROM customers")
    customer_ids = [row[0] for row in cursor.fetchall()]
    
    conn.commit()
    print(f"✓ {len(customer_ids)} clientes criados")
    return customer_ids


def generate_sales(conn, stores, channels, products, items, option_groups, customers, months=6):
    """Gera vendas"""
    print(f"Gerando vendas para {months} meses...")
    
    cursor = conn.cursor()
    start_date = datetime.now() - timedelta(days=30 * months)
    end_date = datetime.now()
    
    anomaly_week = start_date + timedelta(days=random.randint(30, 60))
    promo_day = start_date + timedelta(days=random.randint(90, 120))
    
    current_date = start_date
    total_sales = 0
    
    while current_date <= end_date:
        weekday = current_date.weekday()
        day_mult = WEEKDAY_MULT[weekday]
        
        if anomaly_week <= current_date < anomaly_week + timedelta(days=7):
            day_mult *= 0.7
        
        if current_date.date() == promo_day.date():
            day_mult *= 3.0
        
        daily_sales = int(random.gauss(2700, 400) * day_mult)
        
        for _ in range(daily_sales):
            hour_weights = [get_hour_weight(h) * 100 for h in range(24)]
            hour = random.choices(range(24), weights=hour_weights)[0]
            
            sale_time = current_date.replace(
                hour=hour,
                minute=random.randint(0, 59),
                second=random.randint(0, 59)
            )
            
            store_id = random.choice(stores)
            channel = random.choices(channels, weights=[c['weight'] for c in channels])[0]
            customer_id = random.choice(customers) if random.random() > 0.3 else None
            
            insert_single_sale(cursor, sale_time, store_id, channel, customer_id, 
                             products, items, option_groups)
            total_sales += 1
            
            if total_sales % 1000 == 0:
                conn.commit()
                
        
        conn.commit()
        current_date += timedelta(days=1)
        
        if current_date.day == 1:
            print(f"  → {current_date.strftime('%B %Y')}: {total_sales:,} vendas")
    
    print(f"✓ {total_sales:,} vendas geradas")
    return total_sales


def insert_single_sale(cursor, sale_time, store_id, channel, customer_id, products, items, option_groups):
    """Insere uma venda"""
    
    num_products = min(5, max(1, int(random.expovariate(0.5)) + 1))
    selected_products = random.choices(
        products,
        weights=[p['popularity'] for p in products],
        k=num_products
    )
    
    total_items_value = 0
    products_data = []
    
    for product in selected_products:
        qty = random.randint(1, 3)
        base_price = product['base_price']
        
        items_data = []
        item_additions_price = 0
        
        if product['has_customization'] and random.random() > 0.4:
            num_items = random.randint(1, 4)
            for _ in range(num_items):
                item = random.choice(items)
                item_price = item['price']
                item_additions_price += item_price
                
                items_data.append({
                    'item_id': item['id'],
                    'option_group_id': random.choice(option_groups) if random.random() > 0.5 else None,
                    'quantity': 1,
                    'additional_price': item_price,
                    'price': item_price
                })
        
        product_total = (base_price + item_additions_price) * qty
        total_items_value += product_total
        
        products_data.append({
            'product_id': product['id'],
            'quantity': qty,
            'base_price': base_price,
            'total_price': product_total,
            'items': items_data
        })
    
    discount = 0
    discount_reason = None
    if random.random() < 0.2:
        discount = round(total_items_value * random.uniform(0.05, 0.30), 2)
        discount_reason = random.choice(DISCOUNT_REASONS)
    
    increase = 0
    if random.random() < 0.05:
        increase = round(total_items_value * random.uniform(0.02, 0.10), 2)
    
    delivery_fee = 0
    if channel['type'] == 'D':
        delivery_fee = random.choice([5.0, 7.0, 9.0, 12.0, 15.0])
    
    service_tax = round(total_items_value * 0.10, 2) if random.random() < 0.3 else 0
    
    status = random.choices(SALES_STATUS, STATUS_WEIGHTS)[0]
    
    total_amount = total_items_value - discount + increase + delivery_fee + service_tax
    value_paid = total_amount if status == 'COMPLETED' else 0
    
    production_sec = random.randint(300, 2400) if status == 'COMPLETED' else None
    delivery_sec = random.randint(600, 3600) if channel['type'] == 'D' and status == 'COMPLETED' else None
    
    # Insert sale
    cursor.execute("""
        INSERT INTO sales (
            store_id, customer_id, channel_id, customer_name,
            created_at, sale_status_desc,
            total_amount_items, total_discount, total_increase,
            delivery_fee, service_tax_fee, total_amount, value_paid,
            production_seconds, delivery_seconds,
            discount_reason, people_quantity, origin
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        store_id, customer_id, channel['id'], fake.name() if not customer_id else None,
        sale_time, status,
        total_items_value, discount, increase,
        delivery_fee, service_tax, total_amount, value_paid,
        production_sec, delivery_sec,
        discount_reason, random.randint(1, 8) if channel['type'] == 'P' else None, 'POS'
    ))
    
    sale_id = cursor.lastrowid
    
    # Insert product sales
    for prod_data in products_data:
        cursor.execute("""
            INSERT INTO product_sales (
                sale_id, product_id, quantity, base_price, total_price
            ) VALUES (%s,%s,%s,%s,%s)
        """, (
            sale_id, prod_data['product_id'],
            prod_data['quantity'], prod_data['base_price'],
            prod_data['total_price']
        ))
        product_sale_id = cursor.lastrowid
        
        for item_data in prod_data['items']:
            cursor.execute("""
                INSERT INTO item_product_sales (
                    product_sale_id, item_id, option_group_id,
                    quantity, additional_price, price, amount
                ) VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (
                product_sale_id, item_data['item_id'],
                item_data['option_group_id'],
                item_data['quantity'], item_data['additional_price'],
                item_data['price'], 1
            ))
    
    # Delivery data
    if channel['type'] == 'D' and status == 'COMPLETED':
        lat = -23.5 + random.uniform(-10, 5)
        long = -46.6 + random.uniform(-10, 10)
        
        cursor.execute("""
            INSERT INTO delivery_sales (
                sale_id, courier_name, courier_phone, courier_type,
                delivery_type, status, delivery_fee, courier_fee
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            sale_id, fake.name(), fake.phone_number(),
            random.choice(COURIER_TYPES), random.choice(DELIVERY_TYPES),
            'DELIVERED', delivery_fee, round(delivery_fee * 0.6, 2)
        ))
        delivery_sale_id = cursor.lastrowid
        
        cursor.execute("""
            INSERT INTO delivery_addresses (
                sale_id, delivery_sale_id, street, number, complement,
                neighborhood, city, state, postal_code, latitude, longitude
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            sale_id, delivery_sale_id, fake.street_name(), str(random.randint(10, 9999)),
            random.choice(['Apto 101', 'Casa', None]),
            fake.bairro(), fake.city(), fake.estado_sigla(), fake.postcode(),
            max(-33.0, min(-5.0, lat)), max(-74.0, min(-34.0, long))
        ))
    
    # Payments
    if status == 'COMPLETED':
        cursor.execute("SELECT id FROM payment_types ORDER BY RAND() LIMIT 1")
        result = cursor.fetchone()
        if result:
            cursor.execute("""
                INSERT INTO payments (sale_id, payment_type_id, value)
                VALUES (%s,%s,%s)
            """, (sale_id, result[0], value_paid))


def main():
    parser = argparse.ArgumentParser(description='Gerar dados para MySQL')
    parser.add_argument('--host', default='localhost', help='MySQL host')
    parser.add_argument('--user', default='root', help='MySQL user')
    parser.add_argument('--password', default='123456', help='MySQL password')
    parser.add_argument('--database', default='challenge_db', help='Database name')
    parser.add_argument('--stores', type=int, default=50, help='Número de lojas')
    parser.add_argument('--products', type=int, default=500, help='Número de produtos')
    parser.add_argument('--items', type=int, default=200, help='Número de itens')
    parser.add_argument('--customers', type=int, default=10000, help='Número de clientes')
    parser.add_argument('--months', type=int, default=6, help='Meses de dados')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("Restaurant Analytics - Gerador de Dados MySQL")
    print("=" * 70)
    
    conn = get_db_connection(args.host, args.user, args.password, args.database)
    if not conn:
        return
    
    try:
        sub_brand_ids, channels = setup_base_data(conn)
        stores = generate_stores(conn, sub_brand_ids, args.stores)
        products, items, option_groups = generate_products_and_items(
            conn, sub_brand_ids, args.products, args.items
        )
        customers = generate_customers(conn, args.customers)
        
        total_sales = generate_sales(
            conn, stores, channels, products, items, 
            option_groups, customers, args.months
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sales")
        sales_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM product_sales")
        product_sales_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM item_product_sales")
        item_sales_count = cursor.fetchone()[0]
        
        print()
        print("=" * 70)
        print("✓ Geração completa!")
        print(f"  Lojas: {len(stores):,}")
        print(f"  Produtos: {len(products):,}")
        print(f"  Itens: {len(items):,}")
        print(f"  Clientes: {len(customers):,}")
        print(f"  Vendas: {sales_count:,}")
        print(f"  Produtos Vendidos: {product_sales_count:,}")
        print(f"  Customizações: {item_sales_count:,}")
        print("=" * 70)
        
    except Exception as e:
        print(f"Erro: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    main()