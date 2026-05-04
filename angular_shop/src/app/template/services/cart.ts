import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor(private http: HttpClient) { }

  isLoggedIn = false;

  cart = signal<any[]>(this.loadCart());

  user = signal<any>(null);

  addToCart(product: any) {

    const item = {
      product_id: product.product_id,
      name: product.name,
      image: product.image,
      price: Number(product.price),
      discount_price: Number(product.discount_price || product.price),
      qty: 1
    };

    console.log("isLoggedIn:", this.isLoggedIn);

    if (this.isLoggedIn) {

      return this.http.post(`${environment.apiUrl}/api/cart/add`,
        item,
        { withCredentials: true }
      );

    } else {

      this.cart.update(cart => {

        const existing = cart.find(i => i.product_id === item.product_id);

        if (existing) {
          existing.qty += 1;
        } else {
          cart.push(item);
        }

        return [...cart];
      });

      this.saveCart();

      return of({ message: "local added" });
    }
  }

  loadCartFromDB() {
    return this.http.get<any[]>(`${environment.apiUrl}/api/cart`, {
      withCredentials: true
    });
  }

  checkLogin() {
    return this.http.get(`${environment.apiUrl}/api/current-user`, {
      withCredentials: true
    });
  }

  increase(item: any) {
    item.qty += 1;
    this.cart.set([...this.cart()]);
    this.saveCart();
  }

  decrease(item: any) {
    this.cart.update(items =>
      items.map(i =>
        i.product_id === item.product_id
          ? { ...i, qty: i.qty - 1 }
          : i
      )
    );
    this.saveCart();
  }

  remove(product_id: number) {
    this.cart.update(items => items.filter(i => i.product_id !== product_id));
    this.saveCart();
  }

  getTotal() {
    return this.cart().reduce((sum, item) => {

      const price = Number(item.discount_price ?? item.price ?? 0);
      const qty = Number(item.qty ?? 0);

      if (isNaN(price) || isNaN(qty)) return sum;

      return sum + price * qty;
    }, 0);
  }

  clear() {
    this.cart.set([]);
    this.saveCart();
  }

  loadCart() {
    const data = localStorage.getItem('cart');

    return data
      ? JSON.parse(data).map((i: any) => ({
        ...i,
        price: Number(i.price || 0),
        discount_price: Number(i.discount_price || 0),
        qty: Number(i.qty || 0)
      }))
      : [];
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart()));
  }
}