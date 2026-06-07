import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-product.html',
  styleUrl: './add-product.css',
})
export class AddProduct {
  product: any = {
    name: '',
    price: 0,
    discount_price: 0,
    qty: 0,
    menu_id: null,
    status: 'con hang'
  };

  selectedFile: File | null = null;

  attributes = signal<any[]>([]);
  menus = signal<any[]>([]);
  allProducts = signal<any[]>([]);

  previewImage: string | null = null;

  related = signal<number[]>([]);

  name = '';
  price: number | null = null;
  qty: number | null = null;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    console.log('ngOnInit');
    this.loadMenus();
    this.loadProducts();
  }

  submit() {
    console.log(this.product);

    console.log(this.attributes());

    console.log(this.related());

    const data = {
      product: this.product,
      attributes: this.attributes(),
      related: this.related(),
    };
    this.http.post(
      `${environment.apiUrl}/api/add_product`,
      data,
      { withCredentials: true }
    )
      .subscribe({
        next: res => {
          console.log(this.attributes());
          console.log(res);
          this.router.navigate(['/admin'])
        },
        error: err => {
          console.error(err);
        }
      });

    const formData = new FormData();

    formData.append(
      'image',
      this.selectedFile!
    );

    this.http.post<any>(
      `${environment.apiUrl}/upload-product-image`,
      formData
    )
      .subscribe(res => {

        console.log(res);

        this.product.image = res.image;

      });
  }
  onFileChange(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.previewImage = reader.result as string;
    };

    reader.readAsDataURL(file);
  }
  toggleRelated(productId: number) {

    console.log(productId);

    const current = this.related();

    const index = current.indexOf(productId);

    if (index === -1) {

      this.related.set([
        ...current,
        productId
      ]);

    } else {

      this.related.set(
        current.filter(id => id !== productId)
      );

    }

    console.log(this.related());
  }

  loadMenus() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/menus`
    ).subscribe(res => {
      console.log('menus', res);
      this.menus.set(
        res.filter(m => m.menu_id !== 1 && m.menu_id !== 5)
      );
    });
  }

  loadProducts() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/products`
    ).subscribe(res => {
      console.log(res);
      this.allProducts.set(res);
    });
  }

  loadAttributes() {
    console.log('menu id:', this.product.menu_id);

    if (!this.product.menu_id) return;

    this.http.get<any[]>(
      `${environment.apiUrl}/api/menu/${this.product.menu_id}/attributes`
    )
      .subscribe(res => {
        console.log('attributes:', res);
        this.attributes.set(res);
      });
  }
}
