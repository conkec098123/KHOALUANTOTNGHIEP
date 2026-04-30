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
    console.log("isLoggedIn:", this.isLoggedIn);
    if (this.isLoggedIn) {
      return this.http.post(`${environment.apiUrl}/api/cart/add`, {
        product_id: product.id,
        qty: 1
      }, {
        withCredentials: true
      });
    } else {
      this.cart.update(item => {
        const existing = item.find(i => i.id === product.id);

        if (existing) existing.qty += 1;
        else item.push({ ...product, qty: 1 });

        return [...item];
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
    if (item.qty > 1) item.qty--;
    else this.remove(item.id);

    this.cart.set([...this.cart()]);
    this.saveCart();
  }

  remove(id: number) {
    this.cart.update(items => items.filter(i => i.id !== id));
    this.saveCart();
  }

  getTotal() {
    return this.cart().reduce((sum, item) => sum + item.discount_price * item.qty, 0);
  }

  clear() {
    this.cart.set([]);
    this.saveCart();
  }

  loadCart() {
    const data = localStorage.getItem('cart');
    return data ? JSON.parse(data) : [];
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart()));
  }
}