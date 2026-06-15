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

export class App implements OnInit{

  title = signal('Laptop Store');

  

  products = signal<any[]>([]);

  cart = signal<string[]>([]);

  keyword: string = '';

  environment = environment

  filters: FilterType = {
    ram: [],
    ssd: [],
    cpu: []
  };

  category: number | null = null;

  constructor(private http: HttpClient,
    public cartService: CartService,
    private router: Router,
    private searchService: SearchService) {}

      ngOnInit() {
    this.cartService.checkLogin()
      .subscribe({
        next: (user) => {
          this.cartService.user.set(user);
        },
        error: () => {
          this.cartService.user.set(null);
        }
      });
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

  gotoaddproduct() {
    this.router.navigate(['/add-product'])
    this.isOpen = false;
  }

  gotousersmanagement() {
    this.router.navigate(['/users-management'])
    this.isOpen = false;
  }

  gotouserstatistics() {
    this.router.navigate(['/user-statistics'])
    this.isOpen = false;
  }

  gotoproductstatistics() {
    this.router.navigate(['/product-statistics'])
    this.isOpen = false;
  }

  gotorevenuestatistics() {
    this.router.navigate(['/revenue-statistics'])
    this.isOpen = false;
  }

  gotoorder() {
    this.router.navigate(['/admin-order'])
    this.isOpen = false;
  }

  gototransaction() {
    this.router.navigate(['/transaction-management'])
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
