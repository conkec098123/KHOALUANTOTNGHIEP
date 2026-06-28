import { Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-transaction-management',
  imports: [FormsModule, DecimalPipe, DatePipe, CommonModule],
  templateUrl: './transaction-management.html',
  styleUrl: './transaction-management.css',
})
export class TransactionManagement {

  orders = signal<any[]>([]);
  filteredOrders = signal<any[]>([]);

  showCancelModal = false;
  cancelOrderId = 0;
  cancelNote = '';

  status = '';
  search = '';

  constructor(private http: HttpClient) { }

  loadOrders() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/admin/transactions`
    ).subscribe(data => {

      const transactions = data.filter(
        x =>
          x.order_status === 'pending' ||
          x.order_status === 'shipping' ||
          x.order_status === 'paid'
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
    status: string,
    cancel_note = ''
  ) {

    this.http.put(
      `${environment.apiUrl}/api/admin/orders/${orderId}`,
      {
        order_status: status,
        cancel_note: cancel_note
      }
    ).subscribe(() => {
      this.loadOrders();
    });

  }

  openCancel(orderId: number) {
  this.cancelOrderId = orderId;
  this.cancelNote = '';
  this.showCancelModal = true;
}

confirmCancel() {

  this.changeStatus(
    this.cancelOrderId,
    'cancelled',
    this.cancelNote
  );

  this.showCancelModal = false;

}

  ngOnInit() {
    this.loadOrders();
  }

}
