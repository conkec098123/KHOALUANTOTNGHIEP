import { HttpClient } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Chart } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-revenue-statistics',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './revenue-statistics.html',
  styleUrl: './revenue-statistics.css',
})
export class RevenueStatistics {
  statistics = signal<any[]>([]);
  year = 2026;
  chart: any;

  constructor(private http: HttpClient) { }

  loadStatistics() {

    this.http.get<any[]>(
      `${environment.apiUrl}/api/statistics/revenue?year=${this.year}`
    ).subscribe(data => {

      console.log(data);

      this.statistics.set(data);

      this.renderChart();

    });
  }

  totalRevenue = computed(() =>
    this.statistics().reduce(
      (sum, item) => sum + Number(item.revenue),
      0
    )
  );

  renderChart() {

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.statistics().map(x => `T${x.month}`);
    const revenues = this.statistics().map(x => x.revenue);

    this.chart = new Chart('userChart', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Tổng doanh thu',
          data: revenues,
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
