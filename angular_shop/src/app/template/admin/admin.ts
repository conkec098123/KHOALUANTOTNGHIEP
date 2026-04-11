import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [HttpClientModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit{
  title = signal('Laptop Store');

  products = signal<any[]>([]);

  full_name = signal<string>('');

  cart = signal<string[]>([]);

  constructor(private http: HttpClient, private router: Router) {}
    goToEdit(id: number) {
    console.log("CLICK ID:", id);
    this.router.navigate(['/edit-product', id]);
  }
  

  ngOnInit() {
    this.http.get<any[]>('http://127.0.0.1:5000/api/products', { withCredentials: true })
      .subscribe(data => {
        console.log("DATA:", data);
        this.products.set(data);
      });

    this.http.get<any>('http://127.0.0.1:5000/api/current-user', { withCredentials: true })
      .subscribe(data => {
        console.log(data);
        this.full_name.set(data.name);
      });
  }

  deleteProduct(id: number) {
    if (confirm("Bạn có chắc muốn xóa không?")) {
      this.http.delete(`http://127.0.0.1:5000/api/products/${id}`)
        .subscribe(() => {
          alert("Đã xóa!");

          // reload lại danh sách
          this.products.update(list => list.filter(p => p.id !== id));
        });
    }
  }

  addToCart(productName: string) {
    this.cart.update(items => [...items, productName]);
  }
}
