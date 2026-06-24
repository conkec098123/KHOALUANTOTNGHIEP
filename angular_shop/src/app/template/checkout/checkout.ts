import { Component, signal } from '@angular/core';
import { CartService } from '../services/cart';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  imports: [DecimalPipe, FormsModule],
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

paymentMethod: string = 'cod';
selectedAddressId: number | null = null;

ngOnInit() {
  // if (!this.cartService.cart().length) {
  //   this.router.navigate(['/cart']);
  // }

  this.loadAddress();
}

gotoaddress() {
    this.router.navigate(['/address']);
  }

  checkout() {
  const cart = this.cartService.cart();
  const total = this.cartService.getTotal();

  const payload = {
    cart,
    total,
    address_id: this.selectedAddressId,
    payment_method: this.paymentMethod
  };

  if (this.paymentMethod === 'cod') {

    this.http.post(`${environment.apiUrl}/api/create-order`, payload, {
      withCredentials: true
    }).subscribe(() => {
      this.router.navigate(['/payment-success']);
    });

  } else {

    this.http.post(`${environment.apiUrl}/api/create-order`, payload, {
      withCredentials: true
    }).subscribe(res => {

      const orderId = (res as any).order_id;

      this.http.post(`${environment.apiUrl}/api/create-payment`, {
        order_id: orderId,
        amount: total
      }).subscribe((res: any) => {
        window.location.href = res.payment_url;
      });

    });

  }
}

  loadAddress() {

    console.log('isLoggedIn=', this.cartService.isLoggedIn);
  
      // if (!this.cartService.isLoggedIn) return;
  
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
