import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductByMenu } from './product-by-menu';

describe('ProductByMenu', () => {
  let component: ProductByMenu;
  let fixture: ComponentFixture<ProductByMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductByMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductByMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
