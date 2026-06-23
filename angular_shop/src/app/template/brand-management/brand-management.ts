import { Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-management',
  imports: [FormsModule, CommonModule],
  templateUrl: './brand-management.html',
  styleUrl: './brand-management.css',
})
export class BrandManagement {

  brands = signal<any[]>([]);

  isEdit = false;
  selectedBrand: any = null;
  name = '';
  showModal = false;

  loading = signal(false);

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadBrands();
    this.closeModal(); 
  }

  toggleActive(brand: any) {

    this.loading.set(true);

    console.log(brand);
    console.log('id:', brand.brand_id);
    console.log('is_active:', brand.is_active);

    const newActive = !brand.is_active;

    this.http.put(
      `${environment.apiUrl}/api/brands/${brand.brand_id}/active`,
      {
        is_active: newActive
      }
    ).subscribe({
      next: () => {
        this.loadBrands();
        this.loading.set(false);
      }
    });
  }
  loadBrands() {
    this.http.get<any[]>(
      `${environment.apiUrl}/api/brand`
    ).subscribe(data => {
      this.brands.set(data);
    });
  }
  openAdd() {
  this.showModal = true;
  this.isEdit = false;
  this.name = '';
}

openEdit(brand: any) {
  this.showModal = true;
  this.isEdit = true;
  this.selectedBrand = brand;
  this.name = brand.name;
}

closeModal() {
  this.showModal = false;
  this.isEdit = false;
  this.selectedBrand = null;
  this.name = '';
}
  save() {
    if (this.isEdit) {
      this.updateBrand();
    } else {
      this.addBrand();
    }
  }
  updateBrand() {

    this.http.put(
      `${environment.apiUrl}/api/brands/${this.selectedBrand.brand_id}`,
      {
        name: this.name
      }
    ).subscribe(() => {

      this.loadBrands();

      this.isEdit = false;
      this.selectedBrand = null;
      this.name = '';
    });

  }

  addBrand() {

    this.http.post(
      `${environment.apiUrl}/api/brands`,
      {
        name: this.name
      }
    ).subscribe(() => {

      this.loadBrands();

      this.name = '';
    });

  }
}
