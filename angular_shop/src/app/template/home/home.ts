import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CartService } from '../services/cart';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [HttpClientModule, RouterLink, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit{
  title = signal('Laptop Store');

  products = signal<any[]>([]);

  full_name = signal<string>('');

  cart = signal<string[]>([]);

  constructor(private http: HttpClient, private cartService: CartService, private router: Router) {}

  addToCart(product: any) {
  this.cartService.addToCart(product);
  }

  viewDetail(product: any) {
    this.router.navigate(['/product', product.id]);
    console.log('CLICK OK', product);
  }

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
}
