import { Component, signal } from '@angular/core';
import { CartService } from '../services/cart';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  imports: [DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  constructor(
  public cartService: CartService,
  private router: Router,
  private http: HttpClient
) {}

addresses = signal<any[]>([]);

ngOnInit() {
  // if (!this.cartService.cart().length) {
  //   this.router.navigate(['/cart']);
  // }

  this.loadAddress();
}

gotoaddress() {
    this.router.navigate(['/address']);
  }

  loadAddress() {
  
      if (!this.cartService.isLoggedIn) return;
  
      this.http.get<any[]>(
        `${environment.apiUrl}/api/select/address`,
        {
          withCredentials: true
        }
  
      ).subscribe({
  
        next: (res) => {
  
          this.addresses.set(res);
  
        },
  
        error: () => {
  
        }
  
      });
  
    }
}
