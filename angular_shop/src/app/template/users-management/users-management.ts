import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users-management',
  imports: [],
  templateUrl: './users-management.html',
  styleUrl: './users-management.css',
})
export class UsersManagement {

  users = signal<any[]>([]);

  environment = environment;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
      this.http.get<any[]>(`${environment.apiUrl}/api/users`, { withCredentials: true })
        .subscribe(data => {
          console.log("DATA:", data);
          this.users.set(data);
        });
      }
}
