// Pricing model for the Senthinel hydrogen drone service.
//
// Mirrors the spreadsheet it replaces: every figure below is derived from the
// inputs, nothing is typed in twice. Margin is a share of the selling price,
// not a markup, so price = cost / (1 - margin).

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const safeDiv = (a, b) => (num(b) === 0 ? 0 : num(a) / num(b));
const roundDownTo = (value, step) => (num(step) <= 0 ? num(value) : Math.floor(num(value) / num(step)) * num(step));

export const createPricingInputs = () => ({
  // 1. System and fixed costs
  systemCost: 115000,
  depreciationYears: 4,
  depreciationShare: 1,
  hullInsuranceRate: 0.06,
  liabilityInsurance: 800,
  permitsAndTraining: 5000,
  software: 2500,
  vehicle: 6000,
  storage: 2400,

  // 2. Flight hours per year
  targetHours: 300,
  actualHours: 100,

  // 3. Crew
  crewSize: 2,
  grossSalary: 2500,
  employerCoefficient: 1.338,
  paidHoursPerMonth: 168,
  productiveShare: 0.75,

  // 4. Variable costs
  maintenancePerHour: 45,
  hydrogenPerHour: 5,
  localTripCost: 25,

  // 5. Pricing rules
  overheadRate: 0.15,
  targetMargin: 0.4,
  missionRounding: 100,
  pilotDiscount: 0.2,
  extraHourRounding: 50,
  multiDayDiscount: 0.1,

  // 6. Surcharges shown on the client price list
  freeRadiusKm: 30,
  perKmOutsideRadius: 1.5,
  accommodationFromKm: 200,
  nightWeekendSurcharge: 0.25,
  rushSurcharge: 0.3,
  sensorRentalMarkup: 0.15,
  analysisPerHour: 60,

  // Rows left out of the client price list, by key (see PriceList.js).
  hidden: [],

  // 7. Missions
  missions: [
    { key: 'short', onsiteHours: 2, flightHours: 1.5, workHoursPerPerson: 5 },
    { key: 'halfDay', onsiteHours: 4, flightHours: 3, workHoursPerPerson: 7.75 },
    { key: 'fullDay', onsiteHours: 8, flightHours: 6, workHoursPerPerson: 12 },
  ],
});

export const calculatePricing = (input) => {
  const depreciation = safeDiv(num(input.systemCost), num(input.depreciationYears)) * num(input.depreciationShare);
  const insurance = num(input.systemCost) * num(input.hullInsuranceRate) + num(input.liabilityInsurance);
  const fixedTotal =
    depreciation +
    insurance +
    num(input.permitsAndTraining) +
    num(input.software) +
    num(input.vehicle) +
    num(input.storage);
  const fixedWithoutDepreciation = fixedTotal - depreciation;

  const fixedPerHourTarget = safeDiv(fixedTotal, input.targetHours);
  const fixedPerHourActual = safeDiv(fixedTotal, input.actualHours);
  const cashFixedPerHourActual = safeDiv(fixedWithoutDepreciation, input.actualHours);

  const crewCostPerHour = safeDiv(
    num(input.grossSalary) * num(input.employerCoefficient),
    num(input.paidHoursPerMonth) * num(input.productiveShare)
  );

  const variablePerFlightHour = num(input.maintenancePerHour) + num(input.hydrogenPerHour);

  const missions = (input.missions || []).map((mission) => {
    const crewHours = num(mission.workHoursPerPerson) * num(input.crewSize);
    const fixedCost = num(mission.flightHours) * fixedPerHourTarget;
    const crewCost = crewHours * crewCostPerHour;
    const consumables = num(mission.flightHours) * variablePerFlightHour;
    const directCost = crewCost + consumables + num(input.localTripCost);

    const withOverhead = (cost) => cost * (1 + num(input.overheadRate));
    const costTarget = withOverhead(fixedCost + directCost);
    const costActual = withOverhead(num(mission.flightHours) * fixedPerHourActual + directCost);
    const costCash = withOverhead(num(mission.flightHours) * cashFixedPerHourActual + directCost);

    const rawPrice = num(input.targetMargin) >= 1 ? 0 : safeDiv(costTarget, 1 - num(input.targetMargin));
    const listPrice = roundDownTo(rawPrice, input.missionRounding);
    const pilotPrice = listPrice * (1 - num(input.pilotDiscount));

    return {
      ...mission,
      crewHours,
      fixedCost,
      crewCost,
      consumables,
      localTrip: num(input.localTripCost),
      directCost,
      costTarget,
      costActual,
      costCash,
      rawPrice,
      listPrice,
      pilotPrice,
      listPricePerOnsiteHour: safeDiv(listPrice, mission.onsiteHours),
      pilotPricePerOnsiteHour: safeDiv(pilotPrice, mission.onsiteHours),
      marginTarget: safeDiv(listPrice - costTarget, listPrice),
      marginActual: safeDiv(listPrice - costActual, listPrice),
      pilotMarginActual: safeDiv(pilotPrice - costActual, pilotPrice),
      pilotCashMarginActual: safeDiv(pilotPrice - costCash, pilotPrice),
    };
  });

  const fullDay = missions.find((mission) => mission.key === 'fullDay') || missions[missions.length - 1];

  const extraHourPrice = fullDay
    ? roundDownTo(safeDiv(fullDay.listPrice, fullDay.onsiteHours), input.extraHourRounding)
    : 0;
  const multiDayPrice = fullDay
    ? roundDownTo(fullDay.listPrice * (1 - num(input.multiDayDiscount)), input.missionRounding)
    : 0;

  return {
    depreciation,
    insurance,
    fixedTotal,
    fixedWithoutDepreciation,
    fixedPerHourTarget,
    fixedPerHourActual,
    cashFixedPerHourActual,
    crewCostPerHour,
    variablePerFlightHour,
    missions,
    extraHourPrice,
    extraHourPilotPrice: extraHourPrice * (1 - num(input.pilotDiscount)),
    multiDayPrice,
    multiDayPilotPrice: multiDayPrice * (1 - num(input.pilotDiscount)),
  };
};

// How the pilot-price margin moves with the volume actually flown. Prices stay
// as listed; only the share of fixed cost each mission carries changes.
export const sensitivityByVolume = (input, hoursList = [50, 100, 150, 200, 250, 300, 400, 500]) => {
  const base = calculatePricing(input);
  const fullDay = base.missions.find((mission) => mission.key === 'fullDay') || base.missions[base.missions.length - 1];
  if (!fullDay) return [];

  return hoursList.map((hours) => {
    const perHour = safeDiv(base.fixedTotal, hours);
    const cashPerHour = safeDiv(base.fixedWithoutDepreciation, hours);
    const overhead = 1 + num(input.overheadRate);
    const cost = (num(fullDay.flightHours) * perHour + fullDay.directCost) * overhead;
    const cash = (num(fullDay.flightHours) * cashPerHour + fullDay.directCost) * overhead;

    return {
      hours,
      margin: safeDiv(fullDay.pilotPrice - cost, fullDay.pilotPrice),
      cashMargin: safeDiv(fullDay.pilotPrice - cash, fullDay.pilotPrice),
    };
  });
};
