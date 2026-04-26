import { Component } from '@angular/core';
import { CartService } from '../services/cart';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  constructor(public cartService: CartService, private http: HttpClient) { }

  isLoggedIn = false;

  checkout() {
    this.http.post<any[]>(`${environment.apiUrl}/api/checkout`, {
      cart: this.cartService.cart()
    }).subscribe(() => {
      alert("Đặt hàng thành công");
      this.cartService.clear();
    });
  }

  addToCart(product: any) {

    if (this.isLoggedIn) {
      return this.http.post(`${environment.apiUrl}/api/cart/add`, {
        product_id: product.id,
        qty: 1
      }, { withCredentials: true });

    } else {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");

      const exist = cart.find((p: any) => p.id === product.id);

      if (exist) {
        exist.qty += 1;
      } else {
        cart.push({ ...product, qty: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(cart));

      return null;
    }
  }

  getCart() {
    if (this.isLoggedIn){
      return this.http.get(`${environment.apiUrl}/api/cart`, {
        withCredentials: true
      });

    }else{
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return of(cart);
    }
    }
  }

