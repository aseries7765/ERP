import { ErBedService, ErBedError } from '../../src/modules/his-er/services/er-bed.service';
import { ErDispositionService, ErDispositionError } from '../../src/modules/his-er/services/er-disposition.service';

describe('ErBedService', () => {
  it('registers a bed as AVAILABLE', () => {
    const service = new ErBedService();
    const bed = service.registerBed('bed-1', 'ED-01', 'Main ED');
    expect(bed.status).toBe('AVAILABLE');
  });

  it('rejects duplicate bed registration', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    expect(() => service.registerBed('bed-1', 'ED-01', 'Main ED')).toThrow(ErBedError);
  });

  it('assigns an available bed to a patient', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    const assigned = service.assignBed('bed-1', 'pat-1', new Date('2026-09-18T10:00:00Z'));
    expect(assigned.status).toBe('OCCUPIED');
    expect(assigned.currentPatientId).toBe('pat-1');
  });

  it('rejects assigning an already-occupied bed', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    service.assignBed('bed-1', 'pat-1');
    expect(() => service.assignBed('bed-1', 'pat-2')).toThrow(/not AVAILABLE/);
  });

  it('releases a bed to CLEANING, not directly AVAILABLE', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    service.assignBed('bed-1', 'pat-1');
    const released = service.releaseBed('bed-1');
    expect(released.status).toBe('CLEANING');
    expect(released.currentPatientId).toBeUndefined();
  });

  it('rejects assigning a CLEANING bed until markCleaned is called', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    service.assignBed('bed-1', 'pat-1');
    service.releaseBed('bed-1');
    expect(() => service.assignBed('bed-1', 'pat-2')).toThrow(/not AVAILABLE/);
    const cleaned = service.markCleaned('bed-1');
    expect(cleaned.status).toBe('AVAILABLE');
    const reassigned = service.assignBed('bed-1', 'pat-2');
    expect(reassigned.status).toBe('OCCUPIED');
  });

  it('filters available beds by zone', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    service.registerBed('bed-2', 'FT-01', 'Fast Track');
    expect(service.getAvailableBeds('Fast Track')).toHaveLength(1);
    expect(service.getAvailableBeds()).toHaveLength(2);
  });

  it('rejects taking an occupied bed out of service directly', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    service.assignBed('bed-1', 'pat-1');
    expect(() => service.takeOutOfService('bed-1')).toThrow(/currently OCCUPIED/);
  });

  it('takes an available bed out of service and returns it', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    const out = service.takeOutOfService('bed-1');
    expect(out.status).toBe('OUT_OF_SERVICE');
    const back = service.returnToService('bed-1');
    expect(back.status).toBe('AVAILABLE');
  });

  it('computes occupancy rate correctly, excluding out-of-service beds', () => {
    const service = new ErBedService();
    service.registerBed('bed-1', 'ED-01', 'Main ED');
    service.registerBed('bed-2', 'ED-02', 'Main ED');
    service.registerBed('bed-3', 'ED-03', 'Main ED');
    service.assignBed('bed-1', 'pat-1');
    service.takeOutOfService('bed-3');
    // bed-2 available, bed-1 occupied, bed-3 excluded -> 1/2 = 0.5
    expect(service.getOccupancyRate('Main ED')).toBe(0.5);
  });

  it('throws for an unknown bed id', () => {
    const service = new ErBedService();
    expect(() => service.getBed('nope')).toThrow(ErBedError);
  });
});

describe('ErDispositionService', () => {
  const DOCTOR = { userId: 'doc-1', name: 'Dr. House' };

  it('records an ADMIT disposition with admittingUnit', () => {
    const service = new ErDispositionService();
    const record = service.recordDisposition({
      patientId: 'pat-1', encounterId: 'enc-1', type: 'ADMIT', decidedBy: DOCTOR, admittingUnit: 'Cardiology',
    });
    expect(record.type).toBe('ADMIT');
    expect(record.admittingUnit).toBe('Cardiology');
  });

  it('rejects ADMIT without admittingUnit', () => {
    const service = new ErDispositionService();
    expect(() =>
      service.recordDisposition({ patientId: 'pat-1', encounterId: 'enc-1', type: 'ADMIT', decidedBy: DOCTOR }),
    ).toThrow(/admittingUnit is required/);
  });

  it('rejects TRANSFER without destination and reason', () => {
    const service = new ErDispositionService();
    expect(() =>
      service.recordDisposition({ patientId: 'pat-1', encounterId: 'enc-1', type: 'TRANSFER', decidedBy: DOCTOR }),
    ).toThrow(/transferDestination is required/);
    expect(() =>
      service.recordDisposition({
        patientId: 'pat-1', encounterId: 'enc-1', type: 'TRANSFER', decidedBy: DOCTOR, transferDestination: 'General Hospital',
      }),
    ).toThrow(/transferReason is required/);
  });

  it('records a valid TRANSFER', () => {
    const service = new ErDispositionService();
    const record = service.recordDisposition({
      patientId: 'pat-1', encounterId: 'enc-1', type: 'TRANSFER', decidedBy: DOCTOR,
      transferDestination: 'General Hospital', transferReason: 'Requires cardiac catheterization not available here.',
    });
    expect(record.transferDestination).toBe('General Hospital');
  });

  it('rejects DISCHARGE without instructions', () => {
    const service = new ErDispositionService();
    expect(() =>
      service.recordDisposition({ patientId: 'pat-1', encounterId: 'enc-1', type: 'DISCHARGE', decidedBy: DOCTOR, dischargeInstructions: '' }),
    ).toThrow(/dischargeInstructions are required/);
  });

  it('records a valid DISCHARGE', () => {
    const service = new ErDispositionService();
    const record = service.recordDisposition({
      patientId: 'pat-1', encounterId: 'enc-1', type: 'DISCHARGE', decidedBy: DOCTOR,
      dischargeInstructions: 'Rest, fluids, follow up with PCP in 3 days.',
    });
    expect(record.dischargeInstructions).toContain('follow up');
  });

  it('rejects EXPIRE without timeOfDeath and pronouncedBy', () => {
    const service = new ErDispositionService();
    expect(() =>
      service.recordDisposition({ patientId: 'pat-1', encounterId: 'enc-1', type: 'EXPIRE', decidedBy: DOCTOR }),
    ).toThrow(/timeOfDeath is required/);
    expect(() =>
      service.recordDisposition({
        patientId: 'pat-1', encounterId: 'enc-1', type: 'EXPIRE', decidedBy: DOCTOR, timeOfDeath: new Date(),
      }),
    ).toThrow(/pronouncedBy is required/);
  });

  it('records a valid EXPIRE', () => {
    const service = new ErDispositionService();
    const record = service.recordDisposition({
      patientId: 'pat-1', encounterId: 'enc-1', type: 'EXPIRE', decidedBy: DOCTOR,
      timeOfDeath: new Date('2026-09-18T12:00:00Z'), pronouncedBy: DOCTOR,
    });
    expect(record.type).toBe('EXPIRE');
    expect(record.pronouncedBy).toEqual(DOCTOR);
  });

  it('rejects a second disposition for the same encounter', () => {
    const service = new ErDispositionService();
    service.recordDisposition({
      patientId: 'pat-1', encounterId: 'enc-1', type: 'DISCHARGE', decidedBy: DOCTOR, dischargeInstructions: 'Rest.',
    });
    expect(() =>
      service.recordDisposition({
        patientId: 'pat-1', encounterId: 'enc-1', type: 'ADMIT', decidedBy: DOCTOR, admittingUnit: 'ICU',
      }),
    ).toThrow(/already has a disposition/);
  });

  it('retrieves the disposition for an encounter', () => {
    const service = new ErDispositionService();
    service.recordDisposition({
      patientId: 'pat-1', encounterId: 'enc-1', type: 'DISCHARGE', decidedBy: DOCTOR, dischargeInstructions: 'Rest.',
    });
    expect(service.getDispositionForEncounter('enc-1')?.type).toBe('DISCHARGE');
    expect(service.getDispositionForEncounter('unknown-enc')).toBeUndefined();
  });
});
