import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-management',
  imports: [CommonModule],
  templateUrl: './users-management.html',
  styleUrl: './users-management.css',
})
export class UsersManagement {

  users = signal<any[]>([]);

  environment = environment;

  selectedUser = signal<any>(null);

  loading = signal(false);

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/api/users`, { withCredentials: true })
      .subscribe(data => {
        console.log("DATA:", data);
        this.users.set(data);
      });
  }

  viewUser(id: number) {
    this.http.get<any>(
      `${environment.apiUrl}/api/users/${id}`
    ).subscribe(res => {
      this.selectedUser.set(res);
    });
  }

  closeModal() {
    this.selectedUser.set(null);
  }

  toggleActive(user: any) {

    this.loading.set(true);

    console.log("Trước:", user.active);

    const newActive = !user.active;

    console.log("Gửi:", newActive);

    this.http.put(
      `${environment.apiUrl}/api/users/${user.user_id}/active`,
      {
        active: newActive
      }
    ).subscribe({
    next: () => {
      this.http.get<any[]>(
        `${environment.apiUrl}/api/users`
      ).subscribe(data => {
        this.users.set(data);
        this.loading.set(false);
      });
    },
    error: () => {
      this.loading.set(false);
    }
  });
}
}
