import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';


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
  qty: number = 0;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    // lấy dữ liệu sản phẩm
    this.http.get<any>(`http://127.0.0.1:5000/api/products/${this.id}`)
      .subscribe(data => {
        this.name = data.name;
        this.price = data.price;
        this.qty = data.qty;
      });
  }

  submit() {
    this.http.put(`http://127.0.0.1:5000/api/products/${this.id}`, {
      name: this.name,
      price: this.price,
      qty: this.qty
    }).subscribe(() => {
      this.router.navigate(['/admin']);
    });
  }
}
