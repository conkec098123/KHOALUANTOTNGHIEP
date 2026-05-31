import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-home',
  imports: [CommonModule],
  templateUrl: './main-home.html',
  styleUrl: './main-home.css',
  standalone: true
})
export class MainHome {
  gamingProducts = signal<any[]>([]);
  officeProducts = signal<any[]>([]);
  studentProducts = signal<any[]>([]);
  keyboardProducts = signal<any[]>([]);
  mouseProducts = signal<any[]>([]);

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {

    console.log("HOME INIT");

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/2`
    ).subscribe(res => {
      console.log("GAMING:", res);
      console.log("API RESPONSE:", res);

      this.gamingProducts.set(res);

      console.log("AFTER ASSIGN:", this.gamingProducts);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/3`
    ).subscribe(res => {
      this.officeProducts.set(res);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/4`
    ).subscribe(res => {
      this.studentProducts.set(res);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/6`
    ).subscribe(res => {
      this.keyboardProducts.set(res);
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/api/products/menu/7`
    ).subscribe(res => {
      this.mouseProducts.set(res);
    });

    setTimeout(() => {
      console.log("5 SECONDS LATER:", this.gamingProducts);
    }, 5000);

  }

  test() {
  console.log(this.gamingProducts);
}
}
