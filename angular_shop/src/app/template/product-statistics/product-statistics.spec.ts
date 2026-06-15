import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductStatistics } from './product-statistics';

describe('ProductStatistics', () => {
  let component: ProductStatistics;
  let fixture: ComponentFixture<ProductStatistics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductStatistics],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductStatistics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
