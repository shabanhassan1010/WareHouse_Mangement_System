import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavBlank } from './nav-blank';

describe('NavBlank', () => {
  let component: NavBlank;
  let fixture: ComponentFixture<NavBlank>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBlank]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavBlank);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
