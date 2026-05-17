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

constructor(
  private http: HttpClient,
  private route: ActivatedRoute,
  private router: Router
) {}

goToReview(order_detail_id: number) {

  this.router.navigate(
    ['/review', order_detail_id]
  );

}

ngOnInit() {

  const order_id = this.route.snapshot.paramMap.get('id');

  this.http.get<any[]>(
    `${environment.apiUrl}/api/order-detail/${order_id}`,
    { withCredentials: true }

  ).subscribe(res => {

    this.details.set(res);

  });

}
}
