import { HttpClient } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Chart } from 'chart.js';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-statistics',
  imports: [FormsModule],
  templateUrl: './product-statistics.html',
  styleUrl: './product-statistics.css',
})
export class ProductStatistics {
  statistics = signal<any[]>([]);
  year = 2026;
  chart: any;

  constructor(private http: HttpClient) { }

  loadStatistics() {

    this.http.get<any[]>(
      `${environment.apiUrl}/api/statistics/products?year=${this.year}`
    ).subscribe(data => {

      console.log(data);

      this.statistics.set(data);

      this.renderChart();

    });
  }

  totalProducts = computed(() =>
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
          label: 'Số sản phẩm được tạo',
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
