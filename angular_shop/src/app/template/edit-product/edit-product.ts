import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.css',
})
export class EditProduct {
  product: any = {
    name: '',
    price: 0,
    discount_price: 0,
    qty: 0,
    menu_id: null,
    is_active: true
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

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    this.http.get<any>(
      `${environment.apiUrl}/api/edit-product/${id}`
    )
      .subscribe(res => {

        console.log(res);

        this.product = res.product;

        this.previewImage = '/' + this.product.image;

        console.log("AFTER ASSIGN:", this.product);

        this.attributes.set(res.attributes);

        this.related.set(res.related);

      });
    console.log(id);
    console.log('ngOnInit');
    this.loadMenus();
    this.loadProducts();
  }

  submit() {

  if (this.selectedFile) {

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    this.http.post<any>(
      `${environment.apiUrl}/upload-product-image`,
      formData
    ).subscribe(res => {

      this.product.image = res.image;

      this.updateProduct(); 
    });

  } 
  else {
    this.updateProduct();
  }
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

    // console.log(productId);

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

    // console.log(this.related());
  }

  loadMenus() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/menus`
    ).subscribe(res => {
      // console.log('menus', res);
      this.menus.set(
        res.filter(m => m.menu_id !== 1 && m.menu_id !== 5)
      );
    });
  }

  loadProducts() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/products`
    ).subscribe(res => {
      // console.log(res);
      this.allProducts.set(res);
    });
  }

  loadAttributes() {
    // console.log('menu id:', this.product.menu_id);

    if (!this.product.menu_id) return;

    this.http.get<any[]>(
      `${environment.apiUrl}/api/menu/${this.product.menu_id}/attributes`
    )
      .subscribe(res => {
        // console.log('attributes:', res);
        this.attributes.set(res);
      });
  }
  updateProduct() {

    const data = {
      product: this.product,
      attributes: this.attributes(),
      related: this.related()
    };

    this.http.put(
      `${environment.apiUrl}/api/update-edit-products/${this.product.product_id}`,
      data
    ).subscribe(() => {
      this.router.navigate(['/admin']);
    });
  }
}
