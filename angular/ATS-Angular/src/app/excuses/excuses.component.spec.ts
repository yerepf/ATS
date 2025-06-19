import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcusesComponent } from './excuses.component';

describe('ExcusesComponent', () => {
  let component: ExcusesComponent;
  let fixture: ComponentFixture<ExcusesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcusesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExcusesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
