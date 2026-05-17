import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forget-password',
  imports: [FormsModule],
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.css',
})
export class ForgetPassword {

  token = signal<string>('');
  email = signal<string>('');
  newPassword = signal<string>('');

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router){}

  forgotPassword() {
    this.http.post(`${environment.apiUrl}/api/forgot-password`, {
      email: this.email()
    }).subscribe(res => {
      alert("Check console backend để lấy link");
    });
  }
}
