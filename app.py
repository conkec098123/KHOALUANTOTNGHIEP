import traceback

from flask import Flask, render_template, url_for, request, redirect, session, jsonify
import pyodbc
from flask_cors import CORS

app = Flask(__name__, static_folder='static')
app.secret_key = "abc123"
CORS(app, supports_credentials=True, origins=["http://localhost:4200"])

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

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

@app.route("/")
def home():
    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Products")
    products = cursor.fetchall()
    return render_template("index.html", products=products)

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

@app.route("/register", methods=["GET", "POST"])
def register():
    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        repassword = request.form["repassword"]

        cursor.execute("SELECT * FROM Users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if user:
            return "Username đã tồn tại!"
        if password != repassword:
            return "mật khẩu không trùng khớp"


        cursor.execute("""
            INSERT INTO Users (username, password, role)
            VALUES (?, ?, ?)
        """, (username, password, "user"))

        conn.commit()

        return redirect(url_for("login"))

    return render_template("register.html")

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

@app.route("/admin")
def admin():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Products")
    products = cursor.fetchall()
    return render_template("admin.html", products=products)

@app.route("/admin/orders")
def adminorders():

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()

    cursor.execute("""
        SELECT O.order_id, U.username, O.total_price, O.order_date
        FROM Orders O
        JOIN Users U ON O.users_id = U.users_id
    """)

    orders = cursor.fetchall()

    return render_template("adminorders.html", orders=orders)

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

    # 🔥 BƯỚC QUAN TRỌNG: XÓA CART CŨ
    cursor.execute("DELETE FROM CartDetail WHERE cart_id = ?", (cart_id,))

    # 🔥 insert lại từ local
    for item in cart_items:
        cursor.execute("""
            INSERT INTO CartDetail (cart_id, product_id, qty)
            VALUES (?, ?, ?)
        """, (cart_id, item["id"], item["qty"]))

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

@app.route("/checkout/<int:product_id>")
def checkout(product_id):

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Products WHERE product_id = ?", product_id)
    product = cursor.fetchone()

    return render_template("checkout.html", product=product)

@app.route("/process_payment/<int:product_id>", methods=["POST"])
def process_payment(product_id):

    conn = pyodbc.connect(
    'DRIVER={SQL Server};'
    f'SERVER={server};'
    f'DATABASE={database};'
    'Trusted_Connection=yes;')
    cursor = conn.cursor()
    quantity = int(request.form["quantity"])
    users_id = session["users_id"]

    # Lấy tồn kho hiện tại
    cursor.execute("SELECT price, stock FROM Products WHERE product_id = ?", (product_id,))
    product = cursor.fetchone()

    price = product[0]
    stock = product[1]

    if int(quantity) > stock:
        return "Không đủ hàng"
    
    total = price * quantity
    
    cursor.execute("""
        INSERT INTO Orders (users_id, total_price)
        VALUES (?, ?)
    """, (users_id, total))   

    cursor.execute("SELECT @@IDENTITY")
    order_id = cursor.fetchone()[0]

    cursor.execute("""
        INSERT INTO Order_Details (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
    """, (order_id, product_id, quantity, price))

    # Trừ tồn kho
    cursor.execute("""
        UPDATE Products
        SET stock = stock - ?
        WHERE product_id = ?
    """, (quantity, product_id))

    conn.commit()

    print("Stock before:", stock)
    print("Quantity:", quantity)

    return "Thanh toán thành công"

@app.route("/api/products/filter", methods=["POST"])
def filter_products():
    data = request.get_json()

    ram = [int(x) for x in data.get("ram", [])]
    ssd = [int(x) for x in data.get("ssd", [])]
    cpu = data.get("cpu", [])
    category = data.get("category")

    query = """
    SELECT DISTINCT p.*
    FROM Product p
    WHERE 1=1
    """

    params = []

    # 🔹 lọc category (menu)
    if category is not None:
        query += " AND p.menu_id = ?"
        params.append(category)

    # 🔹 lọc RAM
    if ram:
        query += """
AND p.product_id IN (
    SELECT pa.product_id
    FROM ProductAttribute pa
    JOIN Attribute a ON pa.attribute_id = a.attribute_id
    WHERE a.name = 'RAM'
    AND TRY_CAST(pa.value AS INT) IN ({})
)
""".format(",".join("?" * len(ram)))
        params.extend(ram)

    # 🔹 lọc SSD
    if ssd:
        query += """
AND p.product_id IN (
    SELECT pa.product_id
    FROM ProductAttribute pa
    JOIN Attribute a ON pa.attribute_id = a.attribute_id
    WHERE a.name = 'SSD'
    AND TRY_CAST(pa.value AS INT) IN ({})
)
""".format(",".join("?" * len(ssd)))
        params.extend(ssd)

    # 🔹 lọc CPU (text)
    if cpu:
        query += """
AND p.product_id IN (
    SELECT pa.product_id
    FROM ProductAttribute pa
    JOIN Attribute a ON pa.attribute_id = a.attribute_id
    WHERE a.name = 'CPU'
    AND pa.value IN ({})
)
""".format(",".join("?" * len(cpu)))
        params.extend(cpu)

    print("QUERY:", query)
    print("PARAMS:", params)

    cursor.execute(query, params)
    rows = cursor.fetchall()

    # 👉 convert sang JSON
    products = []
    for r in rows:
        products.append({
            "product_id": r[0],
            "menu_id": r[1],
            "name": r[2],
            "slug": r[3],
            "image": r[4],
            "status": r[6],
            "price": r[7],
            "discount_price": r[8]
        })

    return jsonify(products)

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True, use_reloader=False, threaded=True) 