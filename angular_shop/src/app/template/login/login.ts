import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { environment, environmentgoogle } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart';

declare const google: any;

@Component({
  selector: 'app-login',
  imports: [RouterModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class Login {
  username = '';
  email = '';
  password = '';



  constructor(
    private http: HttpClient,
    private router: Router,
    private cartService: CartService
  ) { }

  gotoregister() {
    this.router.navigate(['/register'])
  }
  gotoforgetpassword() {
    this.router.navigate(['/forget-password'])
  }

  ngOnInit() {

    google.accounts.id.initialize({
      client_id: environmentgoogle.googleClientId,

      callback: (response: any) => {

        console.log(response);

        this.http.post(
          `${environment.apiUrl}/google-login`,
          {
            credential: response.credential
          },
          {
            withCredentials: true
          }
        ).subscribe({
          next: (loginRes) => {
            this.afterLogin(loginRes);
          },
          error: (err) => {
            console.log(err);

            if (err.status === 403) {
              alert("Tài khoản đã bị khóa");
            } else {
              alert("Đăng nhập Google thất bại");
            }
          }
        });

        }  
  });

        google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          {
            theme: "outline",
            size: "large"
          }
        );

      }

  login() {

        const formData = {
          email: this.email,
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

            if (err.status === 403) {
              alert('Tài khoản đã bị khóa');
            }
            else if (err.status === 401) {
              alert('Sai tài khoản hoặc mật khẩu');
            }
            else {
              alert('Đã xảy ra lỗi');
            }
          }
        });
      }
  afterLogin(loginRes: any) {

        this.cartService.user()

        this.http.get<any>(
          `${environment.apiUrl}/api/current-user`,
          { withCredentials: true }
        ).subscribe({
          next: (user) => {

            this.cartService.user.set(user);

            // 2. load cart
            this.cartService.loadCartFromDB().subscribe({
              next: (cartData) => {
                this.cartService.cart.set(cartData || []);

                const total = this.cartService.getTotal();
              },
              error: () => {
                this.cartService.cart.set([]);
              }
            });

            // 3. navigate
            this.router.navigate([
              loginRes.role === 'admin' ? '/admin-home' : '/'
            ]);

          },
          error: () => {
            this.cartService.user.set(null);
            this.router.navigate(['/']);
          }
        });
      }
    }
