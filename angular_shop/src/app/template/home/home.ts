import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CartService } from '../services/cart';
import { CommonModule, DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';

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

  full_name = signal<string>('');

  cart = signal<string[]>([]);

  

  filters: FilterType = {
  ram: [],
  ssd: [],
  cpu: []
};

category: number | null = null;


  constructor(private http: HttpClient, private cartService: CartService, private router: Router) { }

  addToCart(product: any) {
    this.cartService.addToCart(product)
      .subscribe({
        next: (res: any) => {
          console.log("SUCCESS:", res);
        },
        error: (err) => {
          console.log("ERROR:", err);
        }
      });
  }

  viewDetail(product: any) {
    this.router.navigate(['/product', product.id]);
    console.log('CLICK OK', product);
  }

  loadProducts() {
    this.http.post<any[]>(
      `${environment.apiUrl}/api/products/filter`,
      {
        ...this.filters,
        category: this.category
      }
    ).subscribe(res => {
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

    this.http.get<any>(`${environment.apiUrl}/api/current-user`, { withCredentials: true })
      .subscribe(data => {
        console.log(data);
        this.full_name.set(data.name);
      });
  }
}
