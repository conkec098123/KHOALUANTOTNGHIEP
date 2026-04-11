import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cart = signal<any[]>(this.loadCart());

  addToCart(product: any) {
    this.cart.update(items => {
      const existing = items.find(i => i.id === product.id);

      if (existing) {
        existing.qty += 1;
      } else {
        items.push({ ...product, qty: 1 });
      }

      return [...items];
    });

    this.saveCart(); 
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
    return this.cart().reduce((sum, item) => sum + item.price * item.qty, 0);
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