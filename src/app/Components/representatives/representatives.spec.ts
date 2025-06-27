import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Representatives } from './representatives';

describe('Representatives', () => {
  let component: Representatives;
  let fixture: ComponentFixture<Representatives>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Representatives]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Representatives);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
