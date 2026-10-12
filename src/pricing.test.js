import { calculatePricing, createPricingInputs, sensitivityByVolume } from './pricing';

const byKey = (result, key) => result.missions.find((mission) => mission.key === key);

test('reproduces the agreed figures from the default inputs', () => {
  const result = calculatePricing(createPricingInputs());

  expect(result.fixedTotal).toBeCloseTo(52350, 2);
  expect(result.fixedWithoutDepreciation).toBeCloseTo(23600, 2);
  expect(result.fixedPerHourTarget).toBeCloseTo(174.5, 2);
  expect(result.fixedPerHourActual).toBeCloseTo(523.5, 2);
  expect(result.cashFixedPerHourActual).toBeCloseTo(236, 2);
  expect(result.crewCostPerHour).toBeCloseTo(26.55, 2);

  const short = byKey(result, 'short');
  const half = byKey(result, 'halfDay');
  const full = byKey(result, 'fullDay');

  expect(short.costTarget).toBeCloseTo(721, 0);
  expect(half.costTarget).toBeCloseTo(1276, 0);
  expect(full.costTarget).toBeCloseTo(2311, 0);

  expect([short.listPrice, half.listPrice, full.listPrice]).toEqual([1200, 2100, 3800]);
  expect([short.pilotPrice, half.pilotPrice, full.pilotPrice]).toEqual([960, 1680, 3040]);
  expect([short.listPricePerOnsiteHour, half.listPricePerOnsiteHour, full.listPricePerOnsiteHour]).toEqual([600, 525, 475]);
  expect([short.pilotPricePerOnsiteHour, half.pilotPricePerOnsiteHour, full.pilotPricePerOnsiteHour]).toEqual([480, 420, 380]);

  expect(short.marginTarget).toBeCloseTo(0.399, 3);
  expect(half.marginTarget).toBeCloseTo(0.392, 3);
  expect(full.marginTarget).toBeCloseTo(0.392, 3);

  expect(short.pilotMarginActual).toBeCloseTo(-0.38, 2);
  expect(half.pilotMarginActual).toBeCloseTo(-0.48, 2);
  expect(full.pilotMarginActual).toBeCloseTo(-0.55, 2);

  expect(short.pilotCashMarginActual).toBeCloseTo(0.138, 3);
  expect(half.pilotCashMarginActual).toBeCloseTo(0.114, 3);
  expect(full.pilotCashMarginActual).toBeCloseTo(0.1, 3);

  expect(result.extraHourPrice).toBe(450);
  expect(result.extraHourPilotPrice).toBe(360);
  expect(result.multiDayPrice).toBe(3400);
  expect(result.multiDayPilotPrice).toBe(2720);
});

test('drops prices when the drone no longer has to pay for itself', () => {
  const base = calculatePricing(createPricingInputs());
  const paidOff = calculatePricing({ ...createPricingInputs(), depreciationShare: 0 });

  expect(paidOff.fixedTotal).toBeCloseTo(23600, 2);
  paidOff.missions.forEach((mission, index) => {
    expect(mission.listPrice).toBeLessThan(base.missions[index].listPrice);
  });
});

test('closes the gap between target and actual margin once the volume is met', () => {
  const result = calculatePricing({ ...createPricingInputs(), actualHours: 300 });

  result.missions.forEach((mission) => {
    expect(mission.marginActual).toBeCloseTo(mission.marginTarget, 10);
  });
});

test('reports the volume at which the pilot price stops losing money', () => {
  const rows = sensitivityByVolume(createPricingInputs());

  expect(rows).toHaveLength(8);
  expect(rows[0].hours).toBe(50);
  // Cash margin is always the kinder of the two, and margin improves with volume.
  rows.forEach((row) => expect(row.cashMargin).toBeGreaterThan(row.margin));
  expect(rows[rows.length - 1].margin).toBeGreaterThan(rows[0].margin);
});

test('survives inputs that would otherwise divide by zero', () => {
  const result = calculatePricing({
    ...createPricingInputs(),
    targetHours: 0,
    actualHours: 0,
    depreciationYears: 0,
    paidHoursPerMonth: 0,
  });

  const allNumbers = [
    result.fixedPerHourTarget,
    result.crewCostPerHour,
    ...result.missions.map((mission) => mission.listPrice),
  ];
  allNumbers.forEach((value) => expect(Number.isFinite(value)).toBe(true));
});
