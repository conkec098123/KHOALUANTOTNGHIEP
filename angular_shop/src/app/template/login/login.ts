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

  gotoregister() {
    this.router.navigate(['/register'])
  }

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

    this.cartService.loadCartFromDB().subscribe(cartData => {
      this.cartService.cart.set(cartData);

      // LẤY USER TỪ BACKEND
      this.http.get<any>(
        `${environment.apiUrl}/api/current-user`,
        { withCredentials: true }
      ).subscribe(user => {

        this.cartService.user.set(user); // ✔ đúng

        // điều hướng
        if (loginRes.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }

      });

    });
  }
}
