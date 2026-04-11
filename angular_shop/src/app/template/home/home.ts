import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [HttpClientModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit{
  title = signal('Laptop Store');

  products = signal<any[]>([]);

  full_name = signal<string>('');

  cart = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://127.0.0.1:5000/api/products', { withCredentials: true })
      .subscribe(data => {
        this.products.set(data);
      });

    this.http.get<any>('http://127.0.0.1:5000/api/current-user', { withCredentials: true })
      .subscribe(data => {
        console.log(data);
        this.full_name.set(data.name);
      });
  }

  addToCart(productName: string) {
    this.cart.update(items => [...items, productName]);
  }
}
