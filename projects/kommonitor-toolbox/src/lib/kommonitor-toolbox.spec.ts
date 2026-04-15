import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KommonitorToolbox } from './kommonitor-toolbox';

describe('KommonitorToolbox', () => {
  let component: KommonitorToolbox;
  let fixture: ComponentFixture<KommonitorToolbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KommonitorToolbox],
    }).compileComponents();

    fixture = TestBed.createComponent(KommonitorToolbox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
