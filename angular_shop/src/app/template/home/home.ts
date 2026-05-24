import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, effect, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CartService } from '../services/cart';
import { CommonModule, DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SearchService } from '../services/search';

type FilterType = {
  ram: number[];
  ssd: number[];
  cpu: string[];
};

@Component({
  selector: 'app-home',
  imports: [HttpClientModule, RouterLink, DecimalPipe, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  title = signal('Laptop Store');

  products = signal<any[]>([]);

  cart = signal<string[]>([]);

  showFilter = signal(false);



  filters: FilterType = {
    ram: [],
    ssd: [],
    cpu: []
  };

  category: number | null = null;


  constructor(private http: HttpClient,
    private cartService: CartService,
    private router: Router,
    private searchService: SearchService) {
    effect(() => {
      const keyword = this.searchService.keyword();
      this.loadProducts(keyword);
    });
  }

  addToCart(product: any) {

    this.cartService.addToCart(product)
      .subscribe({

        next: (res: any) => {

          console.log("SUCCESS:", res);

          if (this.cartService.user()) {

            this.cartService.loadCartFromDB()
              .subscribe(data => {

                this.cartService.cart.set(data);

              });

          }

        },

        error: (err) => {
          console.log("ERROR:", err);
        }

      });

  }

  viewDetail(product: any) {
    this.router.navigate(['/product', product.product_id]);
    console.log('CLICK OK', product);
  }

  loadProducts(keyword: string = '') {
    this.http.post(`${environment.apiUrl}/api/products/filter`, {
      keyword: keyword,
      category: this.category,
      ...this.filters
    }).subscribe((res: any) => {
      this.products.set(res);
    });
  }

  onFilterChange(type: keyof FilterType, value: any, event: any) {

    if (type === 'ram' || type === 'ssd') {
      const arr = this.filters[type] as number[];

      if (event.target.checked) {
        arr.push(Number(value));
      } else {
        this.filters[type] = arr.filter(v => v !== Number(value));
      }

    } else if (type === 'cpu') {
      const arr = this.filters[type] as string[];

      if (event.target.checked) {
        arr.push(String(value));
      } else {
        this.filters[type] = arr.filter(v => v !== String(value));
      }
    }

    this.loadProducts();
  }

  setCategory(id: number) {
    this.category = id;
    this.loadProducts();
  }

  ngOnInit() {
    this.loadProducts();
  }
}
