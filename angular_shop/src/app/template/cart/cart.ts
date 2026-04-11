import { Component } from '@angular/core';
import { CartService } from '../services/cart';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  constructor(public cartService: CartService, private http: HttpClient) {}

  checkout() {
  this.http.post('http://127.0.0.1:5000/api/checkout', {
    cart: this.cartService.cart()
  }).subscribe(() => {
    alert("Đặt hàng thành công");
    this.cartService.clear();
  });
}
}
