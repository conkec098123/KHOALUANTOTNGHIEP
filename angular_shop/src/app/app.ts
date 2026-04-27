import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { CartService } from './template/services/cart';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = signal('Laptop Store');

  products = signal<any[]>([]);

  full_name = signal<string>('');

  cart = signal<string[]>([]);

  constructor(private http: HttpClient, private cartService: CartService, private router: Router) { }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/api/products`)
      .subscribe(data => {
        this.products.set(data);
      });
    this.http.get<any>(`${environment.apiUrl}/api/current-user`, { withCredentials: true })
      .subscribe(data => {
        console.log(data);
        this.full_name.set(data.name);
      });
  }

  addToCart(productName: string) {
    this.cart.update(items => [...items, productName]);
  }
}
