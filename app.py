from flask import Flask, render_template, url_for, request, redirect, session, jsonify
import pyodbc
from flask_cors import CORS
from flask import jsonify   

app = Flask(__name__, static_folder='static')
app.secret_key = "abc123"
CORS(app, supports_credentials=True, origins=["http://localhost:4200"])

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
    cursor.execute("SELECT * FROM Products")
    products = cursor.fetchall()
    return render_template("index.html", products=products)

@app.route("/api/products")
def api_products():
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

@app.route('/api/current-user')
def current_user():

    # 👉 nếu là admin
    if 'user_id' in session:
        user_id = session['user_id']

        cursor.execute("SELECT username FROM [User] WHERE user_id = ?", user_id)
        user = cursor.fetchone()

        return jsonify({
            "name": user.username,
            "role": "admin"
        })

    # 👉 nếu là customer
    elif 'customer_id' in session:
        customer_id = session['customer_id']

        cursor.execute("SELECT fullname FROM Customer WHERE customer_id = ?", customer_id)
        customer = cursor.fetchone()

        return jsonify({
            "name": customer.fullname,
            "role": "customer"
        })

    return jsonify({
        "name": "Guest",
        "role": "guest"
    })

@app.route("/register", methods=["GET", "POST"])
def register():
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

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        cursor.execute("""
            SELECT * FROM [User]
            WHERE username = ? AND password = ?
        """, (username, password))
        admin = cursor.fetchone()

        if admin:
            session["user_id"] = admin[0]   
            session["role"] = "admin"
            return redirect("http://localhost:4200/admin")  

        # Kiểm tra trong bảng Customer (khách)
        cursor.execute("""
            SELECT * FROM Customer
            WHERE full_name = ? AND password = ?
        """, (username, password))
        customer = cursor.fetchone()

        if customer:
            session["customer_id"] = customer[0]
            session["role"] = "customer"
            return redirect("http://localhost:4200/")
        
        print(session)

        return "Sai tài khoản hoặc mật khẩu"

    return render_template("login.html")

@app.route("/admin")
def admin():
    cursor.execute("SELECT * FROM Products")
    products = cursor.fetchall()
    return render_template("admin.html", products=products)

@app.route("/admin/orders")
def adminorders():

    cursor.execute("""
        SELECT O.order_id, U.username, O.total_price, O.order_date
        FROM Orders O
        JOIN Users U ON O.users_id = U.users_id
    """)

    orders = cursor.fetchall()

    return render_template("adminorders.html", orders=orders)

@app.route("/admin/order/<int:order_id>")
def order_detail(order_id):

    cursor.execute("""
        SELECT P.name, OD.quantity, OD.price
        FROM Order_Details OD
        JOIN Products P ON OD.product_id = P.product_id
        WHERE OD.order_id = ?
    """, (order_id,))

    details = cursor.fetchall()

    return render_template("orderdetails.html", details=details)

@app.route("/add_product", methods=["POST"])
def add_product():
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
    cursor.execute("DELETE FROM Product WHERE product_id = ?", (id,))
    conn.commit()

    return jsonify({"message": "Xóa thành công"})

@app.route("/checkout/<int:product_id>")
def checkout(product_id):
    cursor.execute("SELECT * FROM Products WHERE product_id = ?", product_id)
    product = cursor.fetchone()

    return render_template("checkout.html", product=product)

@app.route("/process_payment/<int:product_id>", methods=["POST"])
def process_payment(product_id):
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

if __name__ == "__main__":
    app.run(debug=True)