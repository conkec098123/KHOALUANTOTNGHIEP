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

  avatar = signal<string>('');

  keyword: string = '';

  environment = environment

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

  if (this.cartService.isLoggedIn) {

    this.http.get<any>(
      `${environment.apiUrl}/api/profile`,
      { withCredentials: true }

    ).subscribe(res => {

      this.full_name.set(res.full_name);
      this.avatar.set(res.avatar);

    });

  }

}



  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  logout() {
    if (confirm("xác nhận đăng xuất")) {
      this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true })
        .subscribe(() => {
          this.cartService.user.set(null);
          this.cartService.cart.set([]);
          this.isOpen = false;
          this.router.navigate(['/']);
        });
    }
  }

  gotochangepassword() {
    this.router.navigate(['/change-password'])
    this.isOpen = false;
  }

  gotoprofile() {
    this.router.navigate(['/profile'])
    this.isOpen = false;
  }

  gotoordermanagement() {
    this.router.navigate(['/order-management'])
    this.isOpen = false;
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
