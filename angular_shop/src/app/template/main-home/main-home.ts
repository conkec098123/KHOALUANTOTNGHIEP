import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-home',
  imports: [CommonModule],
  templateUrl: './main-home.html',
  styleUrl: './main-home.css',
  standalone: true
})
export class MainHome {
  gamingProducts = signal<any[]>([]);
  officeProducts = signal<any[]>([]);
  studentProducts = signal<any[]>([]);
  keyboardProducts = signal<any[]>([]);
  mouseProducts = signal<any[]>([]);

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private cartService: CartService, private router: Router) { }

  ngOnInit(): void {

    console.log("HOME INIT");

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/2`
    ).subscribe(res => {
      console.log("GAMING:", res);
      console.log("API RESPONSE:", res);

      this.gamingProducts.set(res);

      console.log("AFTER ASSIGN:", this.gamingProducts);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/3`
    ).subscribe(res => {
      this.officeProducts.set(res);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/4`
    ).subscribe(res => {
      this.studentProducts.set(res);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/6`
    ).subscribe(res => {
      this.keyboardProducts.set(res);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/7`
    ).subscribe(res => {
      this.mouseProducts.set(res);
    });

    setTimeout(() => {
      console.log("5 SECONDS LATER:", this.gamingProducts);
    }, 5000);

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

  gotohome(){
    this.router.navigate(['/home'])
  }

  viewDetail(product: any) {
    this.router.navigate(['/product', product.product_id]);
    console.log('CLICK OK', product);
  }

  test() {
  console.log(this.gamingProducts);
}
}
