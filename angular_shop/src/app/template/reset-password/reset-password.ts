import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {

  token = signal<string>('');
  email = signal<string>('');
  newPassword = signal<string>('');

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    this.token.set(token);
    console.log("TOKEN FRONT:", this.token());
  }

  resetPassword() {
    this.http.post(`${environment.apiUrl}/api/reset-password`, {
      token: this.token(),
      password: this.newPassword()
    }).subscribe(res => {
      alert("Đổi mật khẩu thành công");
      this.router.navigate(['/login']);
    });
  }
}
