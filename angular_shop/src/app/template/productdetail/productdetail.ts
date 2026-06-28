import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CartService } from '../services/cart';

@Component({
  selector: 'app-productdetail',
  imports: [RouterModule, CommonModule],
  templateUrl: './productdetail.html',
  styleUrl: './productdetail.css',
})
export class Productdetail implements OnInit {


  product = signal<any>(null);

  cart = signal<string[]>([]);

  relatedProducts = signal<any[]>([]);

  selectedImage = '';

  reviews = signal<any[]>([]);

  mouseProducts = signal<any[]>([]);



  environment = environment

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const idParam = params.get('id');

      if (!idParam) return;

      const id = Number(idParam);

      this.http.get<any>(
        `${environment.apiUrl}/api/product/${id}`
      ).subscribe(res => {

        console.log("RES:", res); this.product.set(res); console.log("PRODUCT:", this.product);

        this.selectedImage = res.image;

        console.log("PRODUCT:", res);

      });

      this.http.get<any[]>(
        `${environment.apiUrl}/api/related-products/${id}`
      ).subscribe(res => {

        this.relatedProducts.set(res);

        console.log("RELATED:", res);

      });

      this.loadReviews(id);

    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/7`
    ).subscribe(res => {
      this.mouseProducts.set(res);
    });

  }

  getReviews(productId: number) {
    return this.http.get<any[]>(
      `${environment.apiUrl}/api/reviews/${productId}`
    );
  }

  loadReviews(id: number) {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/reviews/${id}`
    ).subscribe(res => {
      this.reviews.set(res);
    });
  }

  addToCart() {
    this.cartService.addToCart(this.product)
      .subscribe(res => {
        console.log("Added:", res);
      });
  }

  viewDetail(product: any) {
    this.router.navigate(['/product', product.product_id]);
    console.log('CLICK OK', product);
  }
}
