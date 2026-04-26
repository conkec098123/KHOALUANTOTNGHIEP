import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-product',
  imports: [FormsModule],
  templateUrl: './add-product.html',
  styleUrl: './add-product.css',
})
export class AddProduct {
  name = '';
  price: number | null = null;
  qty: number | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  submit() {
    if (!this.name || this.price === null || this.qty === null) return;

    this.http.post(`${environment.apiUrl}/add_product`, {
      name: this.name,
      price: this.price,
      qty: this.qty
    }, { withCredentials: true }).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: err => console.error(err)
    });
  }}
