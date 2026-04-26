import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-edit-product',
  imports: [FormsModule],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.css',
})
export class EditProduct {
  id!: number;
  name = '';
  price: number = 0;
  discount_price: number = 0;
  qty: number = 0;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.http.get<any>(`${environment.apiUrl}api/products/${this.id}`)
      .subscribe(data => {
        this.name = data.name;
        this.price = data.price;
        this.discount_price = data.discount_price;
        this.qty = data.qty;
      });
  }

  submit() {
    this.http.put(`${environment.apiUrl}/api/products/${this.id}`, {
      name: this.name,
      price: this.price,
      discount_price: this.discount_price,
      qty: this.qty
    }).subscribe(() => {
      this.router.navigate(['/admin']);
    });
  }
}
