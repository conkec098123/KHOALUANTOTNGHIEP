import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-review',
  imports: [],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review {

  rating = signal<number>(0);
  comment = signal<string>('');
  order_detail_id = 0;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit() {

    this.order_detail_id =
      Number(this.route.snapshot.paramMap.get('id'));

  }

  submitReview() {

  this.http.post(
    `${environment.apiUrl}/api/review`,
    {
      order_detail_id: this.order_detail_id,
      star: this.rating(),
      content: this.comment()
    },
    { withCredentials: true }
  ).subscribe(res => {

    console.log(res);

  });

}
}
