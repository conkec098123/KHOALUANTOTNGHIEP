import { Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-order',
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './admin-order.html',
  styleUrl: './admin-order.css',
})
export class AdminOrder {

  orders = signal<any[]>([]);
  filteredOrders = signal<any[]>([]);

  status = '';
  search = '';
  period = 'today';

setPeriod(type: string) {
  this.period = type;
  this.filterOrders();
}

  constructor(private http: HttpClient) { }

  loadOrders() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/admin/orders`
    ).subscribe(data => {
      console.log(data);
      this.orders.set(data);
      this.filteredOrders.set(data);
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

    if (this.status) {
      data = data.filter(x =>
        x.order_status === this.status
      );
    }

    if (this.search) {
    data = data.filter(x =>
      x.order_id.toString().includes(this.search)
    );
  }

  const now = new Date();

  data = data.filter(x => {

    const d = new Date(x.order_date);

    const diff =
      (now.getTime() - d.getTime()) /
      (1000 * 60 * 60 * 24);

    switch (this.period) {

      case 'today':
        return d.toDateString() === now.toDateString();

      case 'week':
        return diff > 0 && diff <= 7;

      case 'old':
        return diff > 7;

      default:
        return true;
    }
  });

    this.filteredOrders.set(data);
  }

  ngOnInit() {
    this.loadOrders();
  }
}
