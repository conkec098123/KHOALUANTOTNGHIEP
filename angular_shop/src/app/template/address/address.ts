import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-address',
  imports: [FormsModule],
  templateUrl: './address.html',
  styleUrl: './address.css',
})
export class Address {

  house = signal('');
  street = signal('');
  ward = signal('');
  city = signal('');

  receiver_name = signal('');
  phone_number = signal('');

  constructor(private http: HttpClient, private router: Router){}


  saveAddress() {

    const fullAddress =
      `${this.house()}, ${this.street()}, ${this.ward()}, ${this.city()}`;

    this.http.put(
      `${environment.apiUrl}/api/address`,
      {
        receiver_name: this.receiver_name(),
        phone_number: this.phone_number(),
        address: fullAddress
      }, { withCredentials: true }
    ).subscribe(res => {

      console.log(res);
      this.router.navigate(['/cart'])

    });

  }
}
