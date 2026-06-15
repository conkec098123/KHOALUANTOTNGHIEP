import { Component, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-user-statistics',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-statistics.html',
  styleUrl: './user-statistics.css',
})
export class UserStatistics {
  statistics = signal<any[]>([]);
  year = 2026;
  chart: any;

  constructor(private http: HttpClient) { }

  loadStatistics() {

    this.http.get<any[]>(
      `${environment.apiUrl}/api/statistics/users?year=${this.year}`
    ).subscribe(data => {

      console.log(data);

      this.statistics.set(data);

      this.renderChart();

    });
  }

  totalUsers = computed(() =>
    this.statistics().reduce((sum, item) => sum + item.count, 0)
  );

  renderChart() {

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.statistics().map(x => `T${x.month}`);
    const counts = this.statistics().map(x => x.count);

    this.chart = new Chart('userChart', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Số người dùng đăng ký',
          data: counts,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true
      }
    });
  }

  ngOnInit() {
    this.loadStatistics();
  }
}
