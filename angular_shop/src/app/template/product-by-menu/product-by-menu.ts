import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-by-menu',
  imports: [],
  templateUrl: './product-by-menu.html',
  styleUrl: './product-by-menu.css',
})
export class ProductByMenu {
  products = signal<any[]>([]);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const menuId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/${menuId}`
    ).subscribe(data => {
      this.products.set(data);
    });
  }
}
