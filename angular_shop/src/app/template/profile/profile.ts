import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  full_name = signal<string>('');
  email = signal<string>('');
  avatar = signal<string>('');
  phone_number = signal<string>('');
  dob = signal<string>('');
  gender = signal<string>('');

  environment = environment

  constructor(private http: HttpClient) { }

  ngOnInit() {

    this.http.get<any>(
      `${environment.apiUrl}/api/current-user`,
      { withCredentials: true }

    ).subscribe({

      next: (res) => {

        this.full_name.set(res.full_name);
        this.email.set(res.email);
        this.phone_number.set(res.phone_number);
        this.dob.set(res.dob);
        this.gender.set(res.gender);
        this.avatar.set(res.avatar);

      },

      error: (err) => {

        console.log("Chưa đăng nhập");

      }

    });

  }
  changeprofile() {
    this.http.put(`${environment.apiUrl}/api/customer/profile`, {
      full_name: this.full_name(),
      email: this.email(),
      phone_number: this.phone_number(),
      dob: this.dob(),
      gender: this.gender()
    }, { withCredentials: true }
    )
      .subscribe({
        next: (res: any) => {
          console.log(res)
          alert("đổi thông tin thành công")
        },
        error: (err: any) => {
          alert(err.error.error)
        }
      })
  }
  onFileSelected(event: any) {

    const file = event.target.files[0];

    const formData = new FormData();

    formData.append("avatar", file);

    this.http.post<any>(
      `${environment.apiUrl}/upload-avatar`,
      formData
      , { withCredentials: true }).subscribe(res => {

        this.avatar.set(res.avatar_url);

      });
  }
}
