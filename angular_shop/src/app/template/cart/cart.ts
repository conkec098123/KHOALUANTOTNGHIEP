import { Component } from '@angular/core';
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

  // addToCart(product: any) {

  //   const item = {
  //     product_id: product.product_id,
  //     name: product.name,
  //     image: product.image,
  //     price: product.price,
  //     discount_price: product.discount_price,
  //     qty: 1
  //   };

  //   if (this.isLoggedIn) {

  //     return this.http.post(`${environment.apiUrl}/api/cart/add`,
  //       {
  //         product_id: item.product_id,
  //         qty: item.qty
  //       },
  //       { withCredentials: true }
  //     );

  //   } else {

  //     let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  //     const exist = cart.find((p: any) => p.product_id === item.product_id);

  //     if (exist) {
  //       exist.qty += 1;
  //     } else {
  //       cart.push(item);
  //     }

  //     localStorage.setItem("cart", JSON.stringify(cart));

  //     return of({ message: "local added" });
  //   }
  // }

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
}

