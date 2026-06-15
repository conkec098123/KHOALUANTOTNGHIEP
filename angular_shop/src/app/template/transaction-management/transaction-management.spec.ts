import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionManagement } from './transaction-management';

describe('TransactionManagement', () => {
  let component: TransactionManagement;
  let fixture: ComponentFixture<TransactionManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
