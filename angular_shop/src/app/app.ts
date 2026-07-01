import { HttpClient } from '@angular/common/http';
import { Component, effect, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { environment, environmentgoogle } from '../environments/environment';
import { CartService } from './template/services/cart';
import { SearchService } from './template/services/search';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


type FilterType = {
  ram: number[];
  ssd: number[];
  cpu: string[];
};

declare const google: any;


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
          console.log(this.cartService.user());
          console.log(user);
        },
        error: () => {
          this.cartService.user.set(null);
        }
      });
  }

  isOpen = false;
  openMenu = '';

  toggleDropdown() {
    this.isOpen = !this.isOpen
  }

toggleMenu(menu: string) {
  this.openMenu =
    this.openMenu === menu
      ? ''
      : menu;
}
closeMenu() {
  this.openMenu = '';
}

  logout() {
    if (confirm("xác nhận đăng xuất")) {
      this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true })
        .subscribe(() => {
          this.cartService.user.set(null);
          this.cartService.cart.set([]);
          this.router.navigate(['/']);
        });
    }
  }

  gotochangepassword() {
    this.router.navigate(['/change-password'])
    this.isOpen = false
  }

  gotoprofile() {
    this.router.navigate(['/profile'])
    this.isOpen = false
  }

  gotoordermanagement() {
    this.router.navigate(['/order-management'])
    this.isOpen = false
  }

  gotoaddproduct() {
    this.router.navigate(['/add-product'])
    this.closeMenu()
  }

  gotousersmanagement() {
    this.router.navigate(['/users-management'])
    this.closeMenu()
  }

  gotouserstatistics() {
    this.router.navigate(['/user-statistics'])
    this.closeMenu()
  }

  gotoproductstatistics() {
    this.router.navigate(['/product-statistics'])
    this.closeMenu()
  }

  gotorevenuestatistics() {
    this.router.navigate(['/revenue-statistics'])
    this.closeMenu()
  }

  gotoorder() {
    this.router.navigate(['/admin-order'])
    this.closeMenu()
  }

  gototransaction() {
    this.router.navigate(['/transaction-management'])
    this.closeMenu()
  }

  gotobrand() {
    this.router.navigate(['/brand-management'])
    this.closeMenu()
  }

  getAvatarUrl(avatar: string | null): string {

  if (!avatar) {
    return 'assets/default-avatar.png';
  }

  if (avatar.startsWith('http')) {
    return avatar;
  }

  return `${environment.apiUrl}/${avatar}`;
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
