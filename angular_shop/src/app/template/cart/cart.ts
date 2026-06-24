import { Component, signal } from '@angular/core';
import { CartService } from '../services/cart';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { routes } from '../../app.routes';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  imports: [FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  constructor(public cartService: CartService, private http: HttpClient, private router: Router) { }

  isLoggedIn = false;

  addresses = signal<any[]>([]);

  ngOnInit() {

    console.log(this.cartService.cart());

    this.loadAddress();

  }

  getCart() {
    if (this.isLoggedIn) {
      return this.http.get(`${environment.apiUrl}/api/cart`, {
        withCredentials: true
      });

    } else {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return of(cart);
    }
  }

  checkout() {
    const cart = this.cartService.cart();
    const total = this.cartService.getTotal();

    console.log("CHECKOUT CART:", cart);
    console.log("CHECKOUT TOTAL:", total);

    this.http.post(`${environment.apiUrl}/api/create-order`, {
      cart: cart,
      total: total
    }, { withCredentials: true })
      .subscribe(res => {
        const orderId = (res as any).order_id;

        this.http.post(`${environment.apiUrl}/api/create-payment`, {
          order_id: orderId,
          amount: total
        }).subscribe((res: any) => {
          window.location.href = res.payment_url;
        });
      });
  }

  gotoaddress() {
    this.router.navigate(['/address']);
  }

  gotocheckout() {
    this.router.navigate(['/checkout']);
  }

  loadAddress() {

    if (!this.cartService.isLoggedIn) return;

    this.http.get<any[]>(
      `${environment.apiUrl}/api/select/address`,
      {
        withCredentials: true
      }

    ).subscribe({

      next: (res) => {

        this.addresses.set(res);

      },

      error: () => {

      }

    });

  }
}

