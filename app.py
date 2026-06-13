import traceback

from flask import Flask, render_template, url_for, request, redirect, session, jsonify
import pyodbc
from flask_cors import CORS
import hashlib
import hmac
import urllib.parse
from datetime import datetime, timedelta
import uuid
import smtplib
from email.mime.text import MIMEText
import os
from werkzeug.utils import secure_filename


app = Flask(__name__, static_folder='static')
app.secret_key = "abc123"
CORS(app, supports_credentials=True, origins=["http://localhost:4200"])

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

vnp_TmnCode = "E6SARN01"
vnp_HashSecret = "81Y9ZNK7EFQ8V7SIM613H6A1QCS3ODJE"
vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
vnp_ReturnUrl = "http://localhost:4200/payment-success"

server = r'.\SQLEXPRESS'
database = 'KHOALUANTOTNGHIEP'

conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;'
)

cursor = conn.cursor()
print("Connected successfully!")

UPLOAD_FOLDER = "static/uploads"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PRODUCT_IMAGE_FOLDER = os.path.join(
    BASE_DIR,
    "angular_shop",
    "public",
    "images"
)

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
            "product_id": p[0],
            "name": p[1],
            "price": float(p[2]),
            "discount_price": p[3] if p[3] is not None else 0,
            "image": p[4],
            "qty": p[5]
        })

    conn.close()

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
            cursor.execute("""
            SELECT full_name, email, phone_number, dob, gender, avatar
            FROM Customer
            WHERE customer_id = ?
            """, (session["customer_id"],))

            customer = cursor.fetchone()

            if customer:
                return jsonify({
                    "full_name": customer[0],
                    "email": customer[1],
                    "phone_number": customer[2],
                    "dob": customer[3],
                    "gender": customer[4],
                    "avatar": customer[5],
                    "role": "customer"
                })

        return jsonify(None)
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

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
        SELECT user_id, username
        FROM [User]
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

    cursor.execute("""
        SELECT customer_id, full_name, avatar
        FROM Customer
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
            "product_id": item[0],
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
    conn.close()

    return jsonify({"message": "overwrite success"})

@app.route("/api/cart/remove", methods=["POST"])
def remove_cart_item():

    if "customer_id" not in session:
        return jsonify({"error": "not login"}), 401

    data = request.get_json()

    product_id = data["product_id"]

    customer_id = session["customer_id"]

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""
        DELETE cd
        FROM CartDetail cd
        JOIN Cart c ON cd.cart_id = c.cart_id
        WHERE c.customer_id = ? AND cd.product_id = ?
    """, (customer_id, product_id))

    conn.commit()
    conn.close()

    return jsonify({"message": "removed"})

@app.route("/api/add_product", methods=["POST"])
def add_product():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    data = request.json

    product = data.get("product")
    attributes = data.get("attributes", [])
    related = data.get("related", [])

    print(product)
    print(attributes)
    print(related)

    name = product.get("name")
    image = product.get("image")
    price = product.get("price")
    discount_price = product.get("discount_price")
    qty = product.get("qty")
    menu_id = int(product.get("menu_id"))
    is_active = product["is_active"]
    try:
        cursor.execute("""
            INSERT INTO Product (name, image, price, discount_price, qty, menu_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, image, price, discount_price, qty, menu_id, is_active))

        cursor.execute("""
        SELECT TOP 1 product_id
        FROM Product
        ORDER BY product_id DESC
        """)

        row = cursor.fetchone()

        print(row)

        product_id = row[0]

        for attr in attributes:

            value = attr.get("value")

            if not value:
                continue

            attribute_id = attr.get("id")

            cursor.execute("""
                INSERT INTO ProductAttribute
                (
                    product_id,
                    attribute_id,
                    value
                )
                VALUES (?, ?, ?)
            """,
            (
                product_id,
                attribute_id,
                value
            ))

        print("NEW PRODUCT:", product_id)
        for related_id in related:

            cursor.execute("""
                INSERT INTO ProductRelated
                (
                    product_id,
                    related_product_id
                )
                VALUES (?, ?)
            """,
            (
                product_id,
                related_id
            ))
        conn.commit()
        conn.close()
    except Exception as e:
        conn.rollback()
        print(e)
    return jsonify({"message": "Thêm sản phẩm thành công"})

@app.route("/api/products/filter", methods=["POST"])
def filter_products():
    data = request.get_json()

    ram = data.get("ram", [])
    ssd = data.get("ssd", [])
    cpu = data.get("cpu", [])
    category = data.get("category")
    keyword = data.get("keyword", "")

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    query = """
    SELECT DISTINCT p.*
    FROM Product p
    WHERE p.menu_id IN (2,3,4)
    AND is_active = 1
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

    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
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


    conn.close()

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

    cursor.execute("""
        INSERT INTO Orders (customer_id, total_price, order_status)
        OUTPUT INSERTED.order_id
        VALUES (?, ?, 'pending')
    """, (customer_id, total))

    order_id = cursor.fetchone()[0]

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

@app.route("/api/payment-success", methods=["POST"])
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

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    cursor.execute("SELECT customer_id FROM Customer WHERE LOWER(email) = ?", (email,))
    user = cursor.fetchone()

    print("EMAIL NHẬN:", email)

    if not user:
        return jsonify({"message": "Email không tồn tại"}), 404

    customer_id = user[0]

    token = str(uuid.uuid4())
    expired_at = datetime.now() + timedelta(minutes=10)

    cursor.execute("""
        INSERT INTO PasswordReset (customer_id, token, expired_at)
        VALUES (?, ?, ?)
    """, (customer_id, token, expired_at))

    conn.commit()

    # link gửi mail (tạm thời print)
    reset_link = f"http://localhost:4200/reset-password?token={token}"

    send_email(email, reset_link)

    print("RESET LINK:", reset_link)

    return jsonify({"message": "Đã gửi mail reset (check console)"})

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("password")

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    print("TOKEN NHẬN:", token)

    cursor.execute("""
        SELECT customer_id, expired_at, used
        FROM PasswordReset
        WHERE token = ?
    """, (token,))

    reset = cursor.fetchone()

    if not reset:
        return jsonify({"error": "Token không tồn tại"}), 400

    customer_id, expired_at, used = reset

    if used:
        return jsonify({"error": "Token đã dùng"}), 400

    if expired_at < datetime.now():
        return jsonify({"error": "Token hết hạn"}), 400

    # update password
    cursor.execute("""
        UPDATE Customer
        SET password = ?
        WHERE customer_id = ?
    """, (new_password, customer_id))

    # đánh dấu đã dùng
    cursor.execute("""
        UPDATE PasswordReset
        SET used = 1
        WHERE token = ?
    """, (token,))

    conn.commit()

    return jsonify({"message": "Đổi mật khẩu thành công"})

def send_email(to_email, reset_link):
    sender = "conkec2741@gmail.com"
    app_password = "wigi bpqh dbql kjfp"

    msg = MIMEText(f"Click để reset password:\n{reset_link}")
    msg["Subject"] = "Reset Password"
    msg["From"] = sender
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, app_password)
        server.send_message(msg)

@app.route("/api/customer/profile", methods=["PUT"])
def info_customer():
    data = request.get_json()
    customer_id = session.get("customer_id")
    full_name = data.get("full_name")
    email = data.get("email")
    phone_number = data.get("phone_number")
    dob = data.get("dob")
    gender = data.get("gender")

    if not customer_id:
        return jsonify({"error": "chưa đăng nhập"}), 401
    
    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()

    cursor.execute("SELECT 1 FROM Customer WHERE customer_id = ?", (customer_id,))
    if not cursor.fetchone():
        return jsonify({"error": "không tìm thấy người dùng"}), 404
    
    cursor.execute("""UPDATE Customer 
                   SET full_name = ?,
                   email = ?,
                   phone_number = ?,
                   dob = ?,
                   gender = ?
                   WHERE customer_id = ?""", (full_name, email, phone_number, dob, gender, customer_id))
    
    conn.commit()
    conn.close()

    return jsonify({"message": "thay đổi thông tin thành công"})

@app.route("/upload-avatar", methods=["POST"])
def upload_avatar():

    file = request.files["avatar"]

    customer_id = session.get("customer_id")

    if not file:
        return jsonify({"error": "Không có file"}), 400

    filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"

    filepath = os.path.join(UPLOAD_FOLDER, filename)

    file.save(filepath)

    avatar_url = f"/static/uploads/{filename}"

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()

    cursor.execute("""UPDATE Customer
                   SET avatar = ?
                   WHERE customer_id = ?""", (avatar_url, customer_id),)
    
    conn.commit()
    conn.close()

    return jsonify({
        "avatar_url": f"/static/uploads/{filename}"
    })

@app.route("/api/address", methods=["PUT"])
def address():
    data = request.get_json()
    customer_id = session.get("customer_id")
    receiver_name = data.get("receiver_name")
    phone_number = data.get("phone_number")
    address = data.get("address")

    if not customer_id:
        return jsonify({"error": "chưa đăng nhập"}), 401
    
    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()

    cursor.execute("""
        SELECT address_id
        FROM Address
        WHERE customer_id = ?
    """, (customer_id,))

    existing = cursor.fetchone()
    if existing:

        cursor.execute("""
            UPDATE Address
            SET receiver_name = ?,
                phone_number = ?,
                address = ?
            WHERE customer_id = ?
        """, (
            receiver_name,
            phone_number,
            address,
            customer_id
        ))

    # chưa có thì thêm mới
    else:

        cursor.execute("""
            INSERT INTO Address (
                customer_id,
                receiver_name,
                phone_number,
                address
            )
            VALUES (?, ?, ?, ?)
        """, (
            customer_id,
            receiver_name,
            phone_number,
            address
        ))
    conn.commit()
    conn.close()

    return jsonify({"message": "thay đổi thành công"})

@app.route("/api/select/address", methods=["GET"])
def get_address():

    customer_id = session.get("customer_id")

    if not customer_id:
        return jsonify({"error": "chưa đăng nhập"}), 401

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM Address
        WHERE customer_id = ?
    """, (customer_id,))

    rows = cursor.fetchall()

    result = []

    for row in rows:

        result.append({
            "address_id": row.address_id,
            "receiver_name": row.receiver_name,
            "phone_number": row.phone_number,
            "address": row.address
        })

    conn.close()

    return jsonify(result)

@app.route("/api/orders", methods=["GET"])
def get_orders():

    customer_id = session.get("customer_id")

    if not customer_id:
        return jsonify({"error": "chưa đăng nhập"}), 401

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""
        SELECT order_id,
               total_price,
               order_status,
               created_at
        FROM Orders
        WHERE customer_id = ?
        ORDER BY created_at DESC
    """, (customer_id,))

    rows = cursor.fetchall()

    orders = []

    for row in rows:
        orders.append({
            "order_id": row[0],
            "total_price": float(row[1]),
            "order_status": row[2],
            "created_at": row[3]
        })

    conn.close()

    return jsonify(orders)

@app.route("/api/order-detail/<int:order_id>", methods=["GET"])
def order_detail(order_id):

    customer_id = session.get("customer_id")

    if not customer_id:
        return jsonify({"error": "chưa đăng nhập"}), 401

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""
        SELECT od.order_detail_id,
            product_name,
            product_image,
            discount_price,
            qty,
            subtotal
        FROM OrderDetail od
        JOIN Orders o ON od.order_id = o.order_id
        WHERE od.order_id = ?
        AND o.customer_id = ?
    """, (order_id, customer_id))

    rows = cursor.fetchall()

    result = []

    for row in rows:

        result.append({
            "order_detail_id": row[0],
            "product_name": row[1],
            "product_image": row[2],
            "discount_price": float(row[3] or 0),
            "qty": row[4],
            "subtotal": float(row[5] or 0)
        })

    conn.close()

    return jsonify(result)

@app.route("/api/review", methods=["POST"])
def review():

    data = request.get_json()
    customer_id = session.get("customer_id")

    star = data.get("star")
    content = data.get("content")
    order_detail_id = data.get("order_detail_id")

    if not customer_id:
        return jsonify({"error": "chưa đăng nhập"}), 401

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO Review (order_detail_id, star, content)
        VALUES (?, ?, ?)
        """, (order_detail_id, star, content))
    conn.commit()
    conn.close()

    return jsonify({"message": "OK"})

@app.route('/api/product/<int:id>', methods=['GET'])
def get_product_detail(id):

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    # product chính
    cursor.execute("""
        SELECT
            product_id,
            name,
            price,
            discount_price,
            image
        FROM Product
        WHERE product_id = ?
    """, (id,))

    row = cursor.fetchone()

    if not row:
        return jsonify({"message": "Product not found"}), 404

    # attributes
    cursor.execute("""
        SELECT
            a.name,
            pa.value
        FROM ProductAttribute pa
        JOIN Attribute a
            ON pa.attribute_id = a.attribute_id
        WHERE pa.product_id = ?
    """, (id,))

    attrs = cursor.fetchall()

    # ảnh phụ
    cursor.execute("""
        SELECT image
        FROM ProductImage
        WHERE product_id = ?
        ORDER BY display_order
    """, (id,))

    images = cursor.fetchall()

    conn.close()

    product = {
        "product_id": row.product_id,
        "name": row.name,
        "price": float(row.price or 0),
        "discount_price": float(row.discount_price or 0),
        "image": row.image,

        "images": [img.image for img in images],

        "attributes": [
            {
                "name": attr.name,
                "value": attr.value
            }
            for attr in attrs
        ]
    }

    return jsonify(product)

@app.route("/api/related-products/<int:id>")
def related_products(id):

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""

        SELECT
            p.product_id,
            p.name,
            p.price,
            p.discount_price,
            p.image

        FROM ProductRelated pr

        JOIN Product p
        ON pr.related_product_id = p.product_id

        WHERE pr.product_id = ? AND is_active = 1

    """, (id,))

    rows = cursor.fetchall()
    
    print(rows)

    conn.close()

    products = []

    for p in rows:

        products.append({

            "product_id": p.product_id,
            "name": p.name,
            "price": float(p.price or 0),
            "discount_price": float(p.discount_price or 0),
            "image": p.image

        })

    return jsonify(products)

@app.route("/api/reviews/<int:product_id>")
def get_reviews(product_id):

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.star, r.content, r.created_at, c.full_name AS username
        FROM Review r 
        JOIN OrderDetail od ON r.order_detail_id = od.order_detail_id 
        JOIN Orders o ON od.order_id = o.order_id 
        JOIN Customer c ON o.customer_id = c.customer_id 
        WHERE od.product_id = ? 
        ORDER BY r.created_at DESC
    """, product_id)

    rows = cursor.fetchall()

    return jsonify([
        {
            "star": r.star,
            "content": r.content,
            "created_at": str(r.created_at),
            "username": r.username
        }
        for r in rows
    ])

@app.route("/api/products/menu/<int:menu_id>")
def get_products_by_menu(menu_id):

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            product_id,
            menu_id,
            name,
            alias,
            image,
            status,
            price,
            discount_price
        FROM Product
        WHERE menu_id = ? AND is_active = 1
    """, (menu_id,))

    rows = cursor.fetchall()

    products = []

    for r in rows:
        products.append({
            "product_id": r.product_id,
            "menu_id": r.menu_id,
            "name": r.name,
            "alias": r.alias,
            "image": r.image,
            "status": r.status,
            "price": float(r.price or 0),
            "discount_price": float(r.discount_price or 0)
        })

    conn.close()

    return jsonify(products)

@app.route("/api/menus")
def get_menus():
    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()

    cursor.execute("SELECT menu_id, name FROM Menu")
    rows = cursor.fetchall()

    return jsonify([
        {"menu_id": r[0], "name": r[1]}
        for r in rows
    ])

@app.route("/api/menu/<int:menu_id>/attributes")
def get_menu_attributes(menu_id):
    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    cursor = conn.cursor()

    cursor.execute("""
        SELECT a.attribute_id, a.name
        FROM Attribute a
        JOIN MenuAttribute ma ON a.attribute_id = ma.attribute_id
        WHERE ma.menu_id = ?
    """, (menu_id,))

    rows = cursor.fetchall()

    return jsonify([
        {"id": r[0], "name": r[1]}
        for r in rows
    ])

@app.route("/upload-product-image", methods=["POST"])
def upload_product_image():

    file = request.files.get("image")

    if file and file.filename != "":

        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"

        print(PRODUCT_IMAGE_FOLDER)

        filepath = os.path.join(PRODUCT_IMAGE_FOLDER, filename)

        file.save(filepath)

        image_path = f"images/{filename}"
    else:
        return jsonify({"message": "no image uploaded"}), 200
    return jsonify({
        "image": image_path
    })

@app.route("/api/edit-product/<int:product_id>")
def get_product(product_id):

    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            product_id,
            name,
            image,
            price,
            discount_price,
            qty,
            menu_id,
            is_active
        FROM Product
        WHERE product_id = ?
    """, (product_id,))

    row = cursor.fetchone()

    product = {
        "product_id": row[0],
        "name": row[1],
        "image": row[2],
        "price": float(row[3]),
        "discount_price": float(row[4]),
        "qty": row[5],
        "menu_id": row[6],
        "is_active": row[7]
    }

    cursor.execute("""
        SELECT
            a.attribute_id,
            a.name
        FROM MenuAttribute ma
        JOIN Attribute a
            ON ma.attribute_id = a.attribute_id
        WHERE ma.menu_id = ?
    """, (product["menu_id"],))

    menu_attrs = cursor.fetchall()

    cursor.execute("""
        SELECT
            attribute_id,
            value
        FROM ProductAttribute
        WHERE product_id = ?
    """, (product_id,))

    values = {
        r[0]: r[1]
        for r in cursor.fetchall()
    }

    attributes = []

    for r in menu_attrs:

        attributes.append({
            "id": r[0],
            "name": r[1],
            "value": values.get(r[0], "")
        })

    cursor.execute("""
        SELECT related_product_id
        FROM ProductRelated
        WHERE product_id = ?
    """, (product_id,))

    related = [
        r[0]
        for r in cursor.fetchall()
    ]

    conn.close()

    return jsonify({
        "product": product,
        "attributes": attributes,
        "related": related
    })  

@app.route("/api/update-edit-products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    try:
        data = request.json

        product = data.get("product", {})
        attributes = data.get("attributes", [])
        related = data.get("related", [])

        conn = pyodbc.connect(
            'DRIVER={SQL Server};'
            f'SERVER={server};'
            f'DATABASE={database};'
            'Trusted_Connection=yes;'
        )
        cursor = conn.cursor()

        # fallback image tránh NULL crash
        image = product.get("image") or ""

        cursor.execute("""
            UPDATE Product
            SET name=?,
                price=?,
                discount_price=?,
                qty=?,
                menu_id=?,
                is_active=?,
                image=?
            WHERE product_id=?
        """,
        product.get("name"),
        product.get("price"),
        product.get("discount_price"),
        product.get("qty"),
        product.get("menu_id"),
        product.get("is_active"),
        image,
        product_id)

        # attributes reset
        cursor.execute("DELETE FROM ProductAttribute WHERE product_id=?", product_id)

        for a in attributes:
            if not a.get("value"):
                continue
            cursor.execute("""
                INSERT INTO ProductAttribute(product_id, attribute_id, value)
                VALUES (?, ?, ?)
            """, product_id, a.get("id"), a.get("value"))

        # related reset
        cursor.execute("DELETE FROM ProductRelated WHERE product_id=?", product_id)

        for r in related:
            cursor.execute("""
                INSERT INTO ProductRelated(product_id, related_product_id)
                VALUES (?, ?)
            """, product_id, r)

        conn.commit()
        conn.close()

        print(data)
        print(product_id)

        return jsonify({"message": "updated"})

    except Exception as e:
        print("ERROR:", e)   # <<< QUAN TRỌNG
        return jsonify({"error": str(e)}), 500

@app.route("/api/delete-products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):

    conn = pyodbc.connect(
            'DRIVER={SQL Server};'
            f'SERVER={server};'
            f'DATABASE={database};'
            'Trusted_Connection=yes;'
        )
    cursor = conn.cursor()

    try:
        # 1. xóa liên kết trước (quan trọng)
        cursor.execute("DELETE FROM ProductAttribute WHERE product_id=?", product_id)
        cursor.execute("DELETE FROM ProductRelated WHERE product_id=?", product_id)

        # 2. xóa product
        cursor.execute("DELETE FROM Product WHERE product_id=?", product_id)

        conn.commit()
        return jsonify({"message": "deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@app.route("/api/delete-products/<int:product_id>", methods=["DELETE"])
def delete_image_product(product_id):

    conn = pyodbc.connect(
            'DRIVER={SQL Server};'
            f'SERVER={server};'
            f'DATABASE={database};'
            'Trusted_Connection=yes;'
        )
    cursor = conn.cursor()

    try:
        # lấy image trước khi xóa
        cursor.execute("SELECT image FROM Product WHERE product_id=?", product_id)
        row = cursor.fetchone()

        image_path = row[0] if row else None

        # xóa DB
        cursor.execute("DELETE FROM ProductAttribute WHERE product_id=?", product_id)
        cursor.execute("DELETE FROM ProductRelated WHERE product_id=?", product_id)
        cursor.execute("DELETE FROM Product WHERE product_id=?", product_id)

        conn.commit()

        # xóa file
        if image_path:
            full_path = os.path.join(PRODUCT_IMAGE_FOLDER, image_path.replace("images/", ""))
            if os.path.exists(full_path):
                os.remove(full_path)

        return jsonify({"message": "deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@app.route("/api/users")
def api_users():
    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT customer_id, full_name, email, active, avatar
        FROM Customer
    """)

    rows = cursor.fetchall()

    users = []

    for r in rows:
        users.append({
            "user_id": r.customer_id,
            "username": r.full_name,
            "email": r.email,
            "active": bool(r.active),
            "avatar": r.avatar
        })

    conn.close()

    return jsonify(users)

@app.route("/api/users/<int:id>")
def api_users_detail(id):
    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    cursor.execute("""
        SELECT customer_id, full_name, email, active
        FROM Customer
        WHERE customer_id = ?
    """, (id,))

    r = cursor.fetchone()

    conn.close()

    if not r:
        return jsonify({
            "message": "Không tìm thấy người dùng"
        }), 404

    return jsonify({
        "user_id": r.customer_id,
        "username": r.full_name,
        "email": r.email,
        "active": bool(r.active)
    })


@app.route("/api/users/<int:id>/active",methods=["PUT"])
def update_active(id):

    data = request.get_json()

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')

    cursor = conn.cursor()

    cursor.execute("""
    UPDATE Customer
    SET active=?
    WHERE customer_id=?
    """,
    data["active"],
    id)

    conn.commit()

    conn.close()

    return jsonify({
        "message":"OK"
    })

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True, use_reloader=False, threaded=True) 