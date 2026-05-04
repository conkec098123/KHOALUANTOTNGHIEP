import traceback

from flask import Flask, render_template, url_for, request, redirect, session, jsonify
import pyodbc
from flask_cors import CORS
import hashlib
import hmac
import urllib.parse
from datetime import datetime

app = Flask(__name__, static_folder='static')
app.secret_key = "abc123"
CORS(app, supports_credentials=True, origins=["http://localhost:4200"])

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

vnp_TmnCode = "E6SARN01"
vnp_HashSecret = "81Y9ZNK7EFQ8V7SIM613H6A1QCS3ODJE"
vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
vnp_ReturnUrl = "http://localhost:4200/payment-success"

server = 'localhost'
database = 'KHOALUANTOTNGHIEP'

conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;'
)

cursor = conn.cursor()
print("Connected successfully!")

@app.route("/api/products")
def api_products():
    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT product_id, name, price, discount_price, image, qty
        FROM Product
    """)

    products = cursor.fetchall()

    data = []

    for p in products:
        data.append({
            "id": p[0],
            "name": p[1],
            "price": float(p[2]),
            "discount_price": p[3] if p[3] is not None else 0,
            "image": p[4],
            "qty": p[5]
        })

    return jsonify(data)

@app.route("/api/current-user")
def current_user():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    print("SESSION:", session)
    try:

        if "user_id" in session:
            cursor.execute("SELECT username FROM [User] WHERE user_id = ?", (session["user_id"],))
            user = cursor.fetchone()

            if user:
                return jsonify({
                    "name": user[0],
                    "role": "admin"
                })

        if "customer_id" in session:
            cursor.execute("SELECT full_name FROM Customer WHERE customer_id = ?", (session["customer_id"],))
            customer = cursor.fetchone()

            if customer:
                return jsonify({
                    "name": customer[0],
                    "role": "customer"
                })

        return jsonify({
            "name": "Guest",
            "role": "guest"
        })
    except Exception as e:
        print(traceback.format_exc())

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    repassword = data.get("repassword")

    if not username or not password:
        return jsonify({"error": "Thiếu dữ liệu"}), 400

    if password != repassword:
        return jsonify({"error": "Mật khẩu không khớp"}), 400

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()

    # check user tồn tại
    cursor.execute("SELECT 1 FROM Customer WHERE full_name = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Username đã tồn tại"}), 400

    cursor.execute("""
        INSERT INTO Customer (full_name, password)
        VALUES (?, ?)
    """, (username, password))

    conn.commit()
    conn.close()

    return jsonify({"message": "Đăng ký thành công"})

@app.route("/login", methods=["POST"])
def login():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    data = request.get_json()

    username = data["username"].strip()
    password = data["password"].strip()

    print("USERNAME:", username)
    print("PASSWORD:", password)

    # 🔥 1. CHECK ADMIN
    cursor.execute("""
        SELECT * FROM [User]
        WHERE username = ? AND password = ?
    """, (username, password))

    admin = cursor.fetchone()
    print("ADMIN FOUND:", admin)

    if admin:
        session["user_id"] = admin[0]
        session["role"] = "admin"

        return jsonify({
            "id": admin[0],
            "name": admin[1],
            "role": "admin"
        })

    # 🔥 2. CHECK CUSTOMER
    cursor.execute("""
        SELECT * FROM Customer
        WHERE full_name = ? AND password = ?
    """, (username, password))

    customer = cursor.fetchone()
    print("CUSTOMER FOUND:", customer)

    if customer:
        session["customer_id"] = customer[0]
        session["role"] = "customer"

        return jsonify({
            "id": customer[0],
            "name": customer[1],
            "role": "customer"
        })

    return jsonify({"error": "invalid"}), 401

@app.route("/api/changepassword", methods=["POST"])
def changepassword():
    data = request.get_json()

    customer_id = session.get("customer_id")
    password = data.get('password') 
    newpassword = data.get('newpassword')

    if not customer_id:
        return jsonify({"error": "Chưa đăng nhập"}), 401

    if not password or not newpassword:
        return jsonify({"error": "thiếu dữ liệu"}), 400
    

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM Customer WHERE customer_id = ? AND password = ?", (customer_id, password))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Password không đúng"}), 400
    
    cursor.execute(""" UPDATE Customer SET password = ? WHERE customer_id = ? """, (newpassword, customer_id))

    conn.commit()
    conn.close()
    
    return jsonify({"message": "Đổi mật khẩu thành công"})

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "logged out"})

@app.route("/api/cart", methods=["GET"])
def get_cart():

    if "customer_id" not in session:
        return jsonify([])

    customer_id = session["customer_id"]

    conn = pyodbc.connect('DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.product_id, p.name, p.price, cd.qty
        FROM Cart c
        JOIN CartDetail cd ON c.cart_id = cd.cart_id
        JOIN Product p ON cd.product_id = p.product_id
        WHERE c.customer_id = ?
    """, (customer_id,))

    items = cursor.fetchall()

    result = []
    for item in items:
        result.append({
            "id": item[0],
            "name": item[1],
            "price": item[2],
            "qty": item[3]
        })

    conn.close()

    return jsonify(result)

@app.route("/api/cart/add", methods=["POST"])
def add_to_cart():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    if "customer_id" not in session:
        return jsonify({"error": "not login"}), 401

    data = request.get_json()
    product_id = data["product_id"]
    qty = data.get("qty", 1)

    customer_id = session["customer_id"]

    cursor.execute("SELECT cart_id FROM Cart WHERE customer_id = ?", (customer_id,))
    cart = cursor.fetchone()

    if not cart:
        cursor.execute("INSERT INTO Cart (customer_id) VALUES (?)", (customer_id,))
        conn.commit()

        cursor.execute("SELECT cart_id FROM Cart WHERE customer_id = ?", (customer_id,))
        cart = cursor.fetchone()

    cart_id = cart[0]

    cursor.execute("""
        SELECT * FROM CartDetail
        WHERE cart_id = ? AND product_id = ?
    """, (cart_id, product_id))

    item = cursor.fetchone()

    if item:
        cursor.execute("""
            UPDATE CartDetail
            SET qty = qty + ?
            WHERE cart_id = ? AND product_id = ?
        """, (qty, cart_id, product_id))
    else:
        cursor.execute("""
            INSERT INTO CartDetail (cart_id, product_id, qty)
            VALUES (?, ?, ?)
        """, (cart_id, product_id, qty))

    conn.commit()

    return jsonify({"message": "added"})

@app.route("/api/cart/merge", methods=["POST"])
def merge_cart():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    if "customer_id" not in session:
        return jsonify({"error": "not login"}), 401

    data = request.get_json()
    cart_items = data.get("cart", [])

    customer_id = session["customer_id"]

    # lấy hoặc tạo cart
    cursor.execute("SELECT cart_id FROM Cart WHERE customer_id = ?", (customer_id,))
    cart = cursor.fetchone()

    if not cart:
        cursor.execute("INSERT INTO Cart (customer_id) VALUES (?)", (customer_id,))
        conn.commit()
        cursor.execute("SELECT cart_id FROM Cart WHERE customer_id = ?", (customer_id,))
        cart = cursor.fetchone()

    cart_id = cart[0]

    cursor.execute("DELETE FROM CartDetail WHERE cart_id = ?", (cart_id,))

    for item in cart_items:

        product_id = item.get("product_id") or item.get("id")
        qty = item.get("qty", 1)

        if not product_id:
            continue

        cursor.execute("""
            INSERT INTO CartDetail (cart_id, product_id, qty)
            VALUES (?, ?, ?)
        """, (cart_id, product_id, qty))

    conn.commit()

    return jsonify({"message": "overwrite success"})

@app.route("/add_product", methods=["POST"])
def add_product():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    data = request.json  
    name = data.get("name")
    price = data.get("price")
    qty = data.get("qty")

    cursor.execute("""
        INSERT INTO Product (name, price, qty)
        VALUES (?, ?, ?)
    """, (name, price, qty))
    conn.commit()

    return jsonify({"message": "Thêm sản phẩm thành công"})

@app.route("/api/products/<int:id>")
def get_product(id):

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    cursor.execute("SELECT product_id, name, price, discount_price, qty FROM Product WHERE product_id = ?", (id,))
    p = cursor.fetchone()

    return jsonify({
        "product_id": p[0],
        "name": p[1],
        "price": float(p[2] or 0),
        "discount_price": float(p[2] or 0),
        "qty": int(p[4] or 0)
    })

@app.route("/api/products/<int:id>", methods=["PUT"])
def update_product(id):

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    data = request.get_json()

    name = data.get("name")
    price = float(data.get("price"))
    discount_price = float(data.get("discount_price"))
    qty = int(data.get("qty"))

    cursor.execute("""
        UPDATE Product
        SET name = ?, price = ?, discount_price = ?, qty = ?
        WHERE product_id = ?
    """, (name, price, discount_price, qty, id))

    conn.commit()

    return jsonify({"message": "Cập nhật thành công"})

@app.route('/api/product/<int:id>', methods=['GET'])
def get_product_detail(id):
    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    query = """
    SELECT 
        p.product_id,
        p.name,
        p.price,
        p.discount_price,
        p.image,

        MAX(CASE WHEN a.name = 'CPU' THEN pa.value END) AS cpu,
        MAX(CASE WHEN a.name = 'RAM' THEN pa.value END) AS ram,
        MAX(CASE WHEN a.name = 'SSD' THEN pa.value END) AS ssd

    FROM Product p
    LEFT JOIN ProductAttribute pa ON p.product_id = pa.product_id
    LEFT JOIN Attribute a ON pa.attribute_id = a.attribute_id

    WHERE p.product_id = ?

    GROUP BY 
        p.product_id, p.name, p.price, p.discount_price, p.image
    """

    cursor.execute(query, id)
    row = cursor.fetchone()

    if not row:
        return jsonify({"message": "Product not found"}), 404

    product = {
        "id": row.product_id,
        "name": row.name,
        "price": float(row.price) if row.price else 0,
        "discount_price": float(row.discount_price) if row.discount_price else 0,
        "image": row.image,
        "cpu": row.cpu,
        "ram": row.ram,
        "ssd": row.ssd
    }

    return jsonify(product)

@app.route("/api/products/<int:id>", methods=["DELETE"])
def delete_product(id):

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Product WHERE product_id = ?", (id,))
    conn.commit()

    return jsonify({"message": "Xóa thành công"})

@app.route("/api/products/filter", methods=["POST"])
def filter_products():
    data = request.get_json()

    ram = data.get("ram", [])
    ssd = data.get("ssd", [])
    cpu = data.get("cpu", [])
    category = data.get("category")
    keyword = data.get("keyword", "")

    query = """
    SELECT DISTINCT p.*
    FROM Product p
    WHERE 1=1
    """
    params = []

    if category:
        query += " AND p.menu_id = ?"   
        params.append(category)

    if keyword:
        query += " AND p.name LIKE ?"
        params.append(f"%{keyword}%")

    if ram:
        placeholders = ",".join("?" for _ in ram)
        query += f"""
        AND EXISTS (
            SELECT 1
            FROM ProductAttribute pa
            JOIN Attribute a ON pa.attribute_id = a.attribute_id
            WHERE pa.product_id = p.product_id
              AND a.name = 'RAM'
              AND pa.value IN ({placeholders})
        )
        """
        params.extend([str(x) for x in ram])

    if ssd:
        placeholders = ",".join("?" for _ in ssd)
        query += f"""
        AND EXISTS (
            SELECT 1
            FROM ProductAttribute pa
            JOIN Attribute a ON pa.attribute_id = a.attribute_id
            WHERE pa.product_id = p.product_id
              AND a.name = 'SSD'
              AND pa.value IN ({placeholders})
        )
        """
        params.extend([str(x) for x in ssd])

    if cpu:
        placeholders = ",".join("?" for _ in cpu)
        query += f"""
        AND EXISTS (
            SELECT 1
            FROM ProductAttribute pa
            JOIN Attribute a ON pa.attribute_id = a.attribute_id
            WHERE pa.product_id = p.product_id
              AND a.name = 'CPU'
              AND pa.value IN ({placeholders})
        )
        """
        params.extend(cpu)

    print("QUERY:", query)
    print("PARAMS:", params)

    cursor.execute(query, params)
    rows = cursor.fetchall()

    products = []
    for r in rows:
        products.append({
            "product_id": r[0],
            "menu_id": r[1],
            "name": r[2],
            "alias": r[3],
            "image": r[4],
            "status": r[6],
            "price": r[7],
            "discount_price": r[8]
        })

    return jsonify(products)

@app.route("/api/create-order", methods=["POST"])
def create_order():
    data = request.get_json()

    customer_id = session.get("customer_id")
    cart = data.get("cart")
    total = data.get("total")

    print("RECEIVED:", data)
    print("CART:", cart)
    print("TOTAL:", total)

    if not cart:
        return jsonify({"error": "Cart rỗng"}), 400

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    # tạo order
    cursor.execute("""
        INSERT INTO Orders (customer_id, total_price, order_status)
        OUTPUT INSERTED.order_id
        VALUES (?, ?, 'pending')
    """, (customer_id, total))

    order_id = cursor.fetchone()[0]

    # insert order detail
    for item in cart:

        print("CART:", cart)

        print(data)

        print(type(item.get("price")))
        print(item)

        product_id = item.get("product_id") or item.get("id")

        price = float(item.get("price", 0))
        discount_price = float(item.get("discount_price", 0))
        qty = int(item.get("qty", 0))

        subtotal = qty * discount_price

        cursor.execute("""
            INSERT INTO OrderDetail (
                order_id, product_id, product_name,
                product_image, product_price,
                discount_price, qty, subtotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
        order_id,
        product_id,
        item.get("name"),
        item.get("image"),
        price,
        discount_price,
        qty,
        subtotal
    ))

    conn.commit()
    conn.close()

    return jsonify({"order_id": order_id})

def build_vnpay_hash(data):
    import urllib.parse
    return urllib.parse.urlencode(sorted(data.items()))

@app.route("/api/create-payment", methods=["POST"])
def create_payment():
    data = request.get_json()
    amount = data.get("amount", 0)
    order_id = data.get("order_id")

    if not amount:
        return jsonify({"error": "missing amount"}), 400
    
    amount = float(amount)

    print("AMOUNT FROM FRONTEND:", amount)
    print("TYPE:", type(amount))

    # Thử tính xem:
    print("AMOUNT * 100:", int(amount) * 100)
    print("AMOUNT / 100:", int(amount) / 100)

    
    

    vnp_Params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": vnp_TmnCode,
        "vnp_Amount": int(float(amount) * 100),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": str(order_id),
        "vnp_OrderInfo": f"Thanh toan don hang {order_id}",
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        "vnp_CreateDate": datetime.now().strftime('%Y%m%d%H%M%S'),
        "vnp_IpAddr": request.remote_addr,
        "vnp_ReturnUrl": vnp_ReturnUrl
    }

    if amount < 1000000:  
        vnp_Amount = int(amount * 100)
    else:
        vnp_Amount = int(amount)
    hash_data = build_vnpay_hash(vnp_Params)

    # sort params
    sorted_params = sorted(vnp_Params.items())
    query_string = urllib.parse.urlencode(sorted_params)

    # tạo hash
    hash_data = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote_plus)
    secure_hash = hmac.new(
        vnp_HashSecret.encode('utf-8'),
        hash_data.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()

    payment_url = f"{vnp_Url}?{query_string}&vnp_SecureHash={secure_hash}"

    print("PARAMS:", vnp_Params)
    print("QUERY:", query_string)
    print("HASH STRING:", hash_data)
    print("SIGN:", secure_hash)

    return jsonify({"payment_url": payment_url})

def create_signature(params, secret):
    sorted_params = sorted(params.items())

    query_string = urllib.parse.urlencode(sorted_params)

    hash_value = hmac.new(
        secret.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()

    return hash_value

@app.route("/api/payment-success", methods=["GET"])
def payment_success():
    # Lấy tất cả tham số VNPay gửi về
    query_params = request.args.to_dict()
    
    print("===== VNPAY CALLBACK =====")
    print("FULL QUERY STRING:", request.query_string.decode())
    print("ALL PARAMS:", query_params)
    
    # Lấy chữ ký VNPay gửi sang
    vnp_SecureHash = query_params.get("vnp_SecureHash")
    vnp_SecureHashType = query_params.get("vnp_SecureHashType", "")
    
    print("RECEIVED HASH:", vnp_SecureHash)
    print("HASH TYPE:", vnp_SecureHashType)
    
    # Loại bỏ 2 tham số chữ ký trước khi tính toán lại
    if "vnp_SecureHash" in query_params:
        query_params.pop("vnp_SecureHash")
    if "vnp_SecureHashType" in query_params:
        query_params.pop("vnp_SecureHashType")
    
    # Sắp xếp theo key A-Z
    sorted_params = sorted(query_params.items())
    print("SORTED PARAMS:", sorted_params)
    
    # Tạo query string (THEO ĐÚNG ĐỊNH DẠNG URL ENCODE CỦA VNPAY)
    query_string = "&".join([f"{k}={v}" for k, v in sorted_params])
    
    print("CALC SIGN STRING:", query_string)
    
    # Tính lại chữ ký
    computed_hash = hmac.new(
        vnp_HashSecret.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()
    
    print("COMPUTED HASH:", computed_hash)
    print("COMPARE:", computed_hash == vnp_SecureHash)
    
    if computed_hash != vnp_SecureHash:
        return jsonify({"error": f"Sai chữ ký"}), 400
    
    # Xử lý đơn hàng ở đây
    # Cập nhật trạng thái đơn hàng thành "paid"
    
    return jsonify({"message": "Xác thực thành công"})

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True, use_reloader=False, threaded=True) 