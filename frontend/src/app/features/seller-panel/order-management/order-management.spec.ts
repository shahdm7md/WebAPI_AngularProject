import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerOrdersComponent } from './order-management';

describe('SellerOrdersComponent', () => {
  let component: SellerOrdersComponent;
  let fixture: ComponentFixture<SellerOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerOrdersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SellerOrdersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
