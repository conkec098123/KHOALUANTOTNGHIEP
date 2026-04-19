import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  title = signal('Laptop Store');

  products = signal<any[]>([]);

  cart = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://127.0.0.1:5000/api/products')
      .subscribe(data => {
        this.products.set(data);
      });
  }

  addToCart(productName: string) {
    this.cart.update(items => [...items, productName]);
  }
}
