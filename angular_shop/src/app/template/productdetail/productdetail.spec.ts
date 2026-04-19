import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Productdetail } from './productdetail';

describe('Productdetail', () => {
  let component: Productdetail;
  let fixture: ComponentFixture<Productdetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Productdetail],
    }).compileComponents();

    fixture = TestBed.createComponent(Productdetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
