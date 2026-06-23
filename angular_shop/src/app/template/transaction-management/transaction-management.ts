import { Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-transaction-management',
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './transaction-management.html',
  styleUrl: './transaction-management.css',
})
export class TransactionManagement {

  orders = signal<any[]>([]);
  filteredOrders = signal<any[]>([]);

  status = '';
  search = '';

  constructor(private http: HttpClient) { }

  loadOrders() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/admin/orders`
    ).subscribe(data => {

      const transactions = data.filter(
        x =>
          x.order_status === 'pending' ||
          x.order_status === 'shipping'
      );

      this.orders.set(transactions);
      this.filteredOrders.set(transactions);
    });
  }

  filterOrders() {

    let data = this.orders();

    if (this.search) {
      data = data.filter(x =>
        x.order_id
          .toString()
          .includes(this.search)
      );
    }
    this.filteredOrders.set(data);

    if (this.status) {
      data = data.filter(x =>
        x.order_status === this.status
      );
    }

    this.filteredOrders.set(data);
  }

  changeStatus(
    orderId: number,
    status: string
  ) {

    this.http.put(
      `${environment.apiUrl}/api/admin/orders/${orderId}`,
      {
        order_status: status
      }
    ).subscribe(() => {
      this.loadOrders();
    });

  }

  ngOnInit() {
    this.loadOrders();
  }

}
