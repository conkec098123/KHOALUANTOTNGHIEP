import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CartService } from '../services/cart';

@Component({
  selector: 'app-payment-success',
  imports: [FormsModule],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccess {

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) { }

  ngOnInit() {
  this.route.queryParams.subscribe(params => {

    console.log("VNPAY PARAMS:", params);

    this.http.post(
      `${environment.apiUrl}/api/payment-success`,
      params
    ).subscribe({
      next: (res) => {
        console.log("PAYMENT OK:", res);

        // xóa cart chỉ khi backend xác nhận OK
        this.cartService.cart.set([]);
        localStorage.removeItem("cart");
      },

      error: (err) => {
        console.log("PAYMENT ERROR:", err);
      }
    });

  });
}
  gotohome() {
    this.http.get<any>(`${environment.apiUrl}/api/current-user`,
      { withCredentials: true }
    ).subscribe(user => {

      this.cartService.user.set(user);

      this.router.navigate(['/']);
    }
    )
  };


}
