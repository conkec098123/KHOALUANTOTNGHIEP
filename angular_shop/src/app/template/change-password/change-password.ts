import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../services/cart';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule, ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  password = signal<string>('');

  newpassword = signal<string>('');

  constructor(private http: HttpClient,
    private cartService: CartService,
  ){}

  changepassword(){
      this.http.post(`${environment.apiUrl}/api/changepassword`, { 
        password: this.password(),
        newpassword: this.newpassword() }, { withCredentials: true})
      .subscribe({
        next:(res: any) => {
          console.log(res);
          alert("đổi mật khẩu thành công")
        },
        error: (err: any) => {
          alert(err.error.error);
        }
      }
        )
    }
}
