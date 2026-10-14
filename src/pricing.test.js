import { calculatePricing, createPricingInputs, sensitivityByVolume } from './pricing';
import { buildExtraRows, buildIncludedRows, buildPriceRows } from './PriceList';

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

test('leaves hidden rows out of the client price list', () => {
  const labels = {
    missionNames: { short: 'Lühike', halfDay: 'Pool päeva', fullDay: 'Täispäev' },
    upTo: 'kuni',
    onsite: 'kohapeal',
    extraHourRow: 'Lisatund',
    multiDayRow: 'Mitmepäevane',
    includedCrew: 'Meeskond',
    includedCrewUnit: 'inimest',
    includedPlanning: 'Planeerimine',
    includedInsurance: 'Kindlustus',
    includedSensor: 'Sensor',
    includedData: 'Andmed',
    includedTravel: 'Väljasõit kuni',
    includedWeather: 'Ümberplaneerimine',
    extraTravel: 'Väljasõit üle',
    extraAccommodation: 'Majutus üle',
    extraNight: 'Öötöö',
    extraRush: 'Kiirtöö',
    extraSensor: 'LiDAR',
    extraAnalysis: 'Analüüs',
    atCost: 'kulu järgi',
    cost: 'kulu',
  };

  const input = { ...createPricingInputs(), hidden: ['row:short', 'inc:weather', 'ext:night'] };
  const result = calculatePricing(input);

  const rows = buildPriceRows(result, input, labels);
  expect(rows.map((row) => row.key)).not.toContain('row:short');
  expect(rows.map((row) => row.key)).toContain('row:fullDay');

  expect(buildIncludedRows(input, labels).map((row) => row.key)).not.toContain('inc:weather');
  expect(buildExtraRows(input, labels).map((row) => row.key)).not.toContain('ext:night');

  // The form needs the full set to draw its checkboxes, hidden ones included.
  expect(buildPriceRows(result, input, labels, true)).toHaveLength(5);
  expect(buildIncludedRows(input, labels, true)).toHaveLength(7);
  expect(buildExtraRows(input, labels, true)).toHaveLength(6);

  // Hiding a row changes nothing about the model behind it.
  expect(result.missions[0].listPrice).toBe(1200);
});

test('splits the list price into parts that add back up to it', () => {
  const result = calculatePricing(createPricingInputs());

  result.missions.forEach((mission) => {
    const sum = mission.breakdown.reduce((total, part) => total + part.amount, 0);
    expect(sum).toBeCloseTo(mission.listPrice, 6);
    expect(mission.breakdown.find((part) => part.key === 'rounding').amount).toBeLessThanOrEqual(0);
  });

  const full = result.missions.find((mission) => mission.key === 'fullDay');
  const share = (key) => full.breakdown.find((part) => part.key === key).share;
  // Carrying the drone costs more of a full day's price than the people flying
  // it: fixed cost is the largest single driver after the margin.
  expect(share('fixed')).toBeCloseTo(0.276, 2);
  expect(share('crew')).toBeCloseTo(0.168, 2);
  expect(share('fixed')).toBeGreaterThan(share('crew'));
  // The margin part is struck before rounding, so it reads a little above the
  // 39.2% actually realised; the rounding row gives the difference back.
  expect(share('margin')).toBeCloseTo(0.405, 2);
  expect(share('margin') + share('rounding')).toBeCloseTo(full.marginTarget, 6);
});

test('keeps added rows, order and hiding out of the calculation', () => {
  const labels = {
    missionNames: { short: 'Lühike', halfDay: 'Pool päeva', fullDay: 'Täispäev' },
    upTo: 'kuni',
    onsite: 'kohapeal',
    extraHourRow: 'Lisatund',
    multiDayRow: 'Mitmepäevane',
  };

  const input = {
    ...createPricingInputs(),
    customRows: [{ key: 'row:custom-1', service: 'Öine termoülevaatus', list: 'kokkuleppel', pilot: 'kokkuleppel' }],
    order: { row: ['row:custom-1', 'row:fullDay'] },
  };
  const result = calculatePricing(input);
  const rows = buildPriceRows(result, input, labels);

  // The added row leads, the one named after it follows, the rest keep their place.
  expect(rows[0].key).toBe('row:custom-1');
  expect(rows[0].list).toBe('kokkuleppel');
  expect(rows[1].key).toBe('row:fullDay');
  expect(rows).toHaveLength(6);

  // And none of it moved a price.
  expect(result.missions.map((mission) => mission.listPrice)).toEqual([1200, 2100, 3800]);
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

test('lifts every money figure when the list is shown with VAT', () => {
  const labels = {
    missionNames: { short: 'Lühike', halfDay: 'Pool päeva', fullDay: 'Täispäev' },
    upTo: 'kuni',
    onsite: 'kohapeal',
    extraHourRow: 'Lisatund',
    multiDayRow: 'Mitmepäevane',
    extraTravel: 'Väljasõit üle',
    extraAccommodation: 'Majutus üle',
    extraNight: 'Öötöö',
    extraRush: 'Kiirtöö',
    extraSensor: 'LiDAR',
    extraAnalysis: 'Analüüs',
    atCost: 'tegeliku kulu järgi',
    cost: 'kulu',
  };

  const net = { ...createPricingInputs(), customRows: [{ key: 'row:c1', service: 'Eritöö', list: '500', pilot: 'kokkuleppel' }] };
  const gross = { ...net, showGrossPrices: true };
  const result = calculatePricing(net);

  const netRows = buildPriceRows(result, net, labels);
  const grossRows = buildPriceRows(result, gross, labels);
  const byKey = (rows, key) => rows.find((row) => row.key === key);

  expect(byKey(netRows, 'row:fullDay').list).toBe(3800);
  expect(byKey(grossRows, 'row:fullDay').list).toBeCloseTo(4712, 6);
  expect(byKey(grossRows, 'row:fullDay').pilot).toBeCloseTo(3769.6, 6);

  // A custom row's bare number converts; free text is left exactly as typed.
  expect(byKey(grossRows, 'row:c1').list).toBeCloseTo(620, 6);
  expect(byKey(grossRows, 'row:c1').pilot).toBe('kokkuleppel');

  // Per-unit extras move too; percentages and "at cost" do not.
  const grossExtras = buildExtraRows(gross, labels);
  expect(grossExtras.find((row) => row.key === 'ext:travel').value).toBe('1,86 €/km');
  expect(grossExtras.find((row) => row.key === 'ext:analysis').value).toBe('74,4 €/h');
  expect(grossExtras.find((row) => row.key === 'ext:night').value).toBe('+25%');
  expect(grossExtras.find((row) => row.key === 'ext:accommodation').value).toBe('tegeliku kulu järgi');

  // And the model underneath stays net.
  expect(calculatePricing(gross).missions.map((mission) => mission.listPrice)).toEqual([1200, 2100, 3800]);
});
