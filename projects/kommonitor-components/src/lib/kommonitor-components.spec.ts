import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorComponents } from './kommonitor-components';

describe('KommonitorComponents', () => {
  let component: KommonitorComponents;
  let fixture: ComponentFixture<KommonitorComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KommonitorComponents],
    }).compileComponents();

    fixture = TestBed.createComponent(KommonitorComponents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
