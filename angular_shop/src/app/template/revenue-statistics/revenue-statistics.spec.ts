import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueStatistics } from './revenue-statistics';

describe('RevenueStatistics', () => {
  let component: RevenueStatistics;
  let fixture: ComponentFixture<RevenueStatistics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueStatistics],
    }).compileComponents();

    fixture = TestBed.createComponent(RevenueStatistics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
