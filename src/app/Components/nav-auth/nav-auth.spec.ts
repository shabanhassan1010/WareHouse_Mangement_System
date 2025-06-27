import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavAuth } from './nav-auth';

describe('NavAuth', () => {
  let component: NavAuth;
  let fixture: ComponentFixture<NavAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavAuth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavAuth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
