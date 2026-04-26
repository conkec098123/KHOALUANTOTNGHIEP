import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart';

@Component({
  selector: 'app-login',
  imports: [RouterModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class Login {
  username = '';
  password = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cartService: CartService
  ) { }

  login() {

    const formData = {
      username: this.username,
      password: this.password
    };

    this.http.post<any>(
      `${environment.apiUrl}/login`,
      formData,
      { withCredentials: true }
    ).subscribe({
      next: (loginRes) => {

        console.log('LOGIN SUCCESS:', loginRes);

        const localCart = JSON.parse(localStorage.getItem("cart") || "[]");

        // 🔥 nếu có cart thì mới merge
        if (localCart.length > 0) {

          this.http.post(`${environment.apiUrl}/api/cart/merge`, {
            cart: localCart
          }, { withCredentials: true }).subscribe({
            next: () => {

              localStorage.removeItem("cart");
              console.log("Merged cart lên DB");

              this.afterLogin(loginRes);

            },
            error: (err) => {
              console.log("MERGE ERROR:", err);
            }
          });

        } else {
          this.afterLogin(loginRes);
        }
      },

      error: (err) => {
        console.log('LOGIN ERROR:', err);
        alert('Sai tài khoản hoặc mật khẩu');
      }
    });
  }
  afterLogin(loginRes: any) {

    this.cartService.isLoggedIn = true;

    // 🔥 load cart từ DB
    this.cartService.loadCartFromDB().subscribe(data => {
      this.cartService.cart.set(data);

      if (loginRes.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}
