import { HttpClient } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-home',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css',
})
export class AdminHome {
  revenues = signal<any[]>([]);
  userStatistics = signal<any[]>([]);
  orderStatistics = signal<any[]>([]);
  year = new Date().getFullYear();
  users = signal<any[]>([]);
  orders = signal<any[]>([]);
  topProducts = signal<any[]>([]);
  filteredOrders = signal<any[]>([]);

  status = '';
  
  environment = environment

  constructor( private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.loadStatistics();
    this.loadStatistic();
    this.loadOrders();
    this.loadTopProducts();
    this.loadOrderStatistics();
    console.log(this.orderStatistics());

console.log('Current', this.currentOrders());
console.log('Previous', this.previousOrders());
console.log('Growth', this.orderGrowth());
  }

  goToOrders() {
    this.router.navigate(['/transaction-management']);
  }

  loadStatistics() {

    this.http.get<any[]>(
      `${environment.apiUrl}/api/statistics/revenue?year=${this.year}`
    ).subscribe(data => {

      console.log(data);

      this.revenues.set(data);

    });
  }

  loadStatistic() {

    this.http.get<any[]>(
      `${environment.apiUrl}/api/statistics/users?year=${this.year}`
    ).subscribe(data => {

      console.log(data);

      this.userStatistics.set(data);

    });
  }

  loadOrderStatistics() {

  this.http.get<any[]>(
    `${environment.apiUrl}/api/statistics/orders?year=${this.year}`
  ).subscribe(data => {

    console.log(data);

    this.orderStatistics.set(data);
  });
}

filterOrders() {

    let data = this.orders();

    if (this.status) {
      data = data.filter(x =>
        x.order_status === this.status
      );
    }

    this.filteredOrders.set(data);
  }

  currentRevenue = computed(() => {
    const month = new Date().getMonth() + 1;

    const item = this.revenues().find(
      x => x.month === month
    );

    return Number(item?.revenue || 0);
  });

  previousRevenue = computed(() => {

  const month = new Date().getMonth() + 1;

  const item = this.revenues().find(
    x => x.month === month - 1
  );

  return Number(item?.revenue || 0);
});

revenueGrowth = computed(() => {

  const current = this.currentRevenue();
  const previous = this.previousRevenue();

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
});

  currentOrders = computed(() => {

    const month = new Date().getMonth() + 1;

    const item = this.orderStatistics().find(
      x => x.month === month
    );

    return item?.count || 0;
  });

  previousOrders = computed(() => {

  const month = new Date().getMonth() + 1;

  const item = this.orderStatistics().find(
    x => x.month === month - 1
  );

  return item?.count || 0;
});

  orderGrowth = computed(() => {

  const current = this.currentOrders();
  const previous = this.previousOrders();

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
});

  currentUsers = computed(() => {

    const month = new Date().getMonth() + 1;

    const item = this.userStatistics().find(
      x => x.month === month
    );

    return item?.count || 0;
  });

  previousUsers = computed(() => {

  const month = new Date().getMonth() + 1;

  const item = this.userStatistics().find(
    x => x.month === month - 1
  );

  return item?.count || 0;
});

userGrowth = computed(() => {

  const current = this.currentUsers();
  const previous = this.previousUsers();

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
});

  loadOrders() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/admin/orders`
    ).subscribe(data => {
      this.orders.set(data);
      this.filteredOrders.set(data);
    });
  }

  loadTopProducts() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/top`
    ).subscribe(data => {
      this.topProducts.set(data);
    });
  }

  pendingOrders = computed(
    () =>
      this.orders().filter(
        x => x.order_status === 'pending'
      ).length
  );
}
