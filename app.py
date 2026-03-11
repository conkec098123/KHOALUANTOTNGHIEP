from flask import Flask, render_template, url_for, request, redirect
import pyodbc

app = Flask(__name__)

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

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        repassword = request.form["repassword"]

        # kiểm tra trùng username
        cursor.execute("SELECT * FROM Users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if user:
            return "Username đã tồn tại!"
        if password != repassword:
            return "mật khẩu không trùng khớp"


        # insert nếu chưa tồn tại
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
            SELECT * FROM Users
            WHERE username = ? AND password = ?
        """, (username, password))

        user = cursor.fetchone()

        if user:
            if user.role == "admin":
                return redirect(url_for("admin"))
            else:
                return redirect(url_for("home"))
        else:
            return "Sai tài khoản hoặc mật khẩu"

    return render_template("login.html")

@app.route("/admin")
def admin():
    cursor.execute("SELECT * FROM Products")
    products = cursor.fetchall()
    return render_template("admin.html", products=products)

@app.route("/add_product", methods=["GET", "POST"])
def add_product():
    if request.method == "POST":
        name = request.form["name"]
        price = request.form["price"]
        stock = request.form["stock"]

        cursor.execute("""
            INSERT INTO Products (name, price, stock)
            VALUES (?, ?, ?)
        """, (name, price, stock))
        conn.commit()

        return redirect(url_for("home"))

    return render_template("addproduct.html")

@app.route("/checkout/<int:product_id>")
def checkout(product_id):
    cursor.execute("SELECT * FROM Products WHERE product_id = ?", product_id)
    product = cursor.fetchone()

    return render_template("checkout.html", product=product)

@app.route("/process_payment/<int:product_id>", methods=["POST"])
def process_payment(product_id):
    quantity = request.form["quantity"]

    # Lấy tồn kho hiện tại
    cursor.execute("SELECT stock FROM Products WHERE product_id = ?", product_id)
    stock = cursor.fetchone()[0]

    if int(quantity) > stock:
        return "Không đủ hàng"

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