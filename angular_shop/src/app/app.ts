import { HttpClient } from '@angular/common/http';
import { Component, effect, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { CartService } from './template/services/cart';
import { SearchService } from './template/services/search';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


type FilterType = {
  ram: number[];
  ssd: number[];
  cpu: string[];
};


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, FormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {
  title = signal('Laptop Store');

  products = signal<any[]>([]);

  full_name = signal<string>('');

  cart = signal<string[]>([]);

  keyword: string = '';

  get user() {
  return this.cartService.user;
}

  filters: FilterType = {
    ram: [],
    ssd: [],
    cpu: []
  };  

  category: number | null = null;

  constructor(private http: HttpClient,
    public cartService: CartService,
    private router: Router,
    private searchService: SearchService) {
    effect(() => {
      const user = this.cartService.user();

      if (user) {
        this.full_name.set(user.name);
      } else {
        this.full_name.set('');
      }
    });
  }

  ngOnInit() {
    

  }

  

  isOpen = false;

toggleDropdown() {
  this.isOpen = !this.isOpen;
}

  logout() {
    this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe(() => {
        this.cartService.user.set(null);
        this.cartService.cart.set([]);
        this.isOpen = false;
        this.router.navigate(['/']);
      });
  }

  search() {
    console.log("SEARCH:", this.keyword);
    this.searchService.keyword.set(this.keyword);

    this.http.post(
      `${environment.apiUrl}/api/products/filter`,
      {
        keyword: this.keyword,
        ...this.filters
      }
    ).subscribe((res: any) => {
      this.products.set(res as any[]);
    });
  }

  addToCart(productName: string) {
    this.cart.update(items => [...items, productName]);
  }
}
