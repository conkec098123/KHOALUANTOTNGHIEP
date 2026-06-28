import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  username = '';
  email = '';
  password = '';
  repassword = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }
  register() {
    this.http.post(`${environment.apiUrl}/api/register`, {
      username: this.username,
      email: this.email,
      password: this.password,
      repassword: this.repassword
    }).subscribe({
      next: (res: any) => {
        console.log(res);
        alert("Đăng ký thành công");
        this.gotologin();
      },
      error: (err: any) => {
        console.log(err.error);
        alert(err.error.error);
      }
    });
  }

  gotologin() {
    this.router.navigate(['/login'])
  }
}

