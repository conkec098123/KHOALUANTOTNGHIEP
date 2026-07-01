import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-detail',
  imports: [],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail {


  details = signal<any[]>([]);
  order = signal<any>(null);

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  goToReview(order_detail_id: number) {

    this.router.navigate(
      ['/review', order_detail_id]
    );

  }

  ngOnInit() {

    const order_id = this.route.snapshot.paramMap.get('id');

    this.http.get<any>(
      `${environment.apiUrl}/api/order-detail/${order_id}`
    )
      .subscribe(res => {

        this.order.set(res.order);
        this.details.set(res.details);

      });
  }

  cancelOrder() {

  const order_id = this.route.snapshot.paramMap.get('id');

  this.http.put(
    `${environment.apiUrl}/api/order/cancel/${order_id}`,
    {},
    { withCredentials: true }
  )
  .subscribe(() => {

    this.order.update(order => ({
      ...order,
      order_status: 'cancelled'
    }));
     window.location.reload();

  });

}

changeStatus(
    orderId: number,
    status: string,
    cancel_note = ''
  ) {

    if (status === 'delivered') {

    const confirmResult = confirm(
      'Chỉ xác nhận nếu quý khách đã nhận hàng và đã kiểm tra đầy đủ. Bạn có chắc chắn?'
    );

    if (!confirmResult) return;
  }

    this.http.put(
      `${environment.apiUrl}/api/admin/orders/${orderId}`,
      {
        order_status: status,
        cancel_note: cancel_note
      }
    ).subscribe(() => {
      this.order.update(order => ({
      ...order,
      order_status: status
    }));

  });

  }
}
