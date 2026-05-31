import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CartService } from '../services/cart';

@Component({
  selector: 'app-productdetail',
  imports: [RouterModule, CommonModule],
  templateUrl: './productdetail.html',
  styleUrl: './productdetail.css',
})
export class Productdetail implements OnInit {


  product: any = {};

  cart = signal<string[]>([]);

  relatedProducts: any[] = [];

  selectedImage = '';

  reviews: any[] = [];



  environment = environment

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const idParam = params.get('id');

      if (!idParam) return;

      const id = Number(idParam);

      this.http.get<any>(
        `${environment.apiUrl}/api/product/${id}`
      ).subscribe(res => {

        console.log("RES:", res); this.product = res; console.log("PRODUCT:", this.product);

        this.cdr.detectChanges();

        this.selectedImage = res.image;

        console.log("PRODUCT:", res);

      });

      this.http.get<any[]>(
        `${environment.apiUrl}/api/related-products/${id}`
      ).subscribe(res => {

        this.relatedProducts = res;

        console.log("RELATED:", res);

        this.cdr.detectChanges();

      });

      this.loadReviews(id);

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
      this.reviews = res;
      this.cdr.detectChanges();
    });
  }

  addToCart() {
    this.cartService.addToCart(this.product)
      .subscribe(res => {
        console.log("Added:", res);
      });
  }
}
