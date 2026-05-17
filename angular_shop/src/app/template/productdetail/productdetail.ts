import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-productdetail',
  imports: [RouterModule, CommonModule],
  templateUrl: './productdetail.html',
  styleUrl: './productdetail.css',
  standalone: true,
})
export class Productdetail implements OnInit {

  product: any; 

  environment = environment

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      this.product = null;

      this.http.get(`${environment.apiUrl}/api/product/${id}`)
        .subscribe((res: any) => {
          this.product = res;
          this.cdr.detectChanges();
        });
    });
  }
}
