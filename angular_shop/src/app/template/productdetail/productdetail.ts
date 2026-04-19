import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-productdetail',
  imports: [RouterModule, CommonModule],
  templateUrl: './productdetail.html',
  styleUrl: './productdetail.css',
  standalone: true,
})
export class Productdetail implements OnInit {

  product: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      this.product = null;

      this.http.get(`http://localhost:5000/api/product/${id}`)
        .subscribe((res: any) => {
          this.product = res;
          this.cdr.detectChanges();
        });
    });
  }
}
