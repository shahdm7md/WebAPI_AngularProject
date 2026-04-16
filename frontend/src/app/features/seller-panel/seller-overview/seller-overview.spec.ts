import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerOverView } from './seller-overview';

describe('SellerOverView', () => {
  let component: SellerOverView;
  let fixture: ComponentFixture<SellerOverView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerOverView],
    }).compileComponents();

    fixture = TestBed.createComponent(SellerOverView  );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
