import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-management',
  imports: [FormsModule, CommonModule],
  templateUrl: './order-management.html',
  styleUrl: './order-management.css',
})
export class OrderManagement {

  constructor( private http: HttpClient, private router: Router ){}

  isOpen = false;

  toggleDropdown(){
    this.isOpen = !this.isOpen
  }

  gotoOrderDetail(order_id: number) {

  this.router.navigate(['/order-detail', order_id]);

}

  orders = signal<any[]>([]);

ngOnInit() {

  this.http.get<any[]>(
    `${environment.apiUrl}/api/orders`,
    { withCredentials: true }

  ).subscribe(res => {

    this.orders.set(res);

  });

}
}
