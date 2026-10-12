import React from 'react';
import {
  Box,
  Divider,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';

// Percentages are stored as fractions (0.15) but edited as whole numbers (15),
// which is how everyone talks about them.
const Field = ({ label, value, onChange, unit, percent = false, note, size = 6 }) => (
  <Grid size={{ xs: 12, sm: size }}>
    <TextField
      label={label}
      type="number"
      value={percent ? Math.round(Number(value) * 1000) / 10 : value}
      onChange={(event) => {
        const raw = parseFloat(event.target.value);
        const next = Number.isNaN(raw) ? 0 : raw;
        onChange(percent ? next / 100 : next);
      }}
      helperText={note}
      slotProps={{
        input: unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : undefined,
      }}
      fullWidth
    />
  </Grid>
);

const Section = ({ title, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography
      sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}
    >
      {title}
    </Typography>
    <Grid container spacing={1.25}>
      {children}
    </Grid>
  </Box>
);

export default function PricingForm({ data, onDataChange, result, labels }) {
  const set = (field) => (value) => onDataChange({ ...data, [field]: value });
  const setMission = (index, field) => (value) => {
    const missions = data.missions.map((mission, missionIndex) =>
      missionIndex === index ? { ...mission, [field]: value } : mission
    );
    onDataChange({ ...data, missions });
  };

  const euro = (value) => `${(Number(value) || 0).toLocaleString('et-EE', { maximumFractionDigits: 0 })} €`;
  const euro2 = (value) => `${(Number(value) || 0).toFixed(2)} €`;

  const Readout = ({ label, value, strong = false }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.4 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={strong ? 700 : 500} sx={{ whiteSpace: 'nowrap' }}>{value}</Typography>
    </Box>
  );

  return (
    <Box>
      <Section title={labels.pricingSystem}>
        <Field label={labels.systemCost} value={data.systemCost} onChange={set('systemCost')} unit="€" note="80–150 000 €, keskpunkt" />
        <Field label={labels.depreciationYears} value={data.depreciationYears} onChange={set('depreciationYears')} unit="a" />
        <Field
          label={labels.depreciationShare}
          value={data.depreciationShare}
          onChange={set('depreciationShare')}
          unit="%"
          percent
          note="0% = droon on juba tasutud"
        />
        <Field label={labels.hullInsurance} value={data.hullInsuranceRate} onChange={set('hullInsuranceRate')} unit="%" percent note="süsteemi väärtusest aastas" />
        <Field label={labels.liabilityInsurance} value={data.liabilityInsurance} onChange={set('liabilityInsurance')} unit="€/a" />
        <Field label={labels.permits} value={data.permitsAndTraining} onChange={set('permitsAndTraining')} unit="€/a" note="PDRA/SORA, riigilõiv" />
        <Field label={labels.software} value={data.software} onChange={set('software')} unit="€/a" />
        <Field label={labels.vehicle} value={data.vehicle} onChange={set('vehicle')} unit="€/a" />
        <Field label={labels.storage} value={data.storage} onChange={set('storage')} unit="€/a" />
      </Section>

      <Section title={labels.pricingVolume}>
        <Field label={labels.targetHours} value={data.targetHours} onChange={set('targetHours')} unit="h/a" note="hind arvutatakse selle mahu järgi" />
        <Field label={labels.actualHours} value={data.actualHours} onChange={set('actualHours')} unit="h/a" note="mida reaalselt ootad" />
      </Section>

      <Section title={labels.pricingCrew}>
        <Field label={labels.crewSize} value={data.crewSize} onChange={set('crewSize')} note="piloot + vaatleja" />
        <Field label={labels.grossSalary} value={data.grossSalary} onChange={set('grossSalary')} unit="€/kuu" />
        <Field label={labels.employerCoefficient} value={data.employerCoefficient} onChange={set('employerCoefficient')} note="sotsiaalmaks 33% + 0,8%" />
        <Field label={labels.paidHours} value={data.paidHoursPerMonth} onChange={set('paidHoursPerMonth')} unit="h/kuu" />
        <Field label={labels.productiveShare} value={data.productiveShare} onChange={set('productiveShare')} unit="%" percent note="ülejäänu: puhkus, koolitus, admin" size={12} />
      </Section>

      <Section title={labels.pricingVariable}>
        <Field label={labels.maintenance} value={data.maintenancePerHour} onChange={set('maintenancePerHour')} unit="€/h" note="stack, mootorid, propellerid" />
        <Field label={labels.hydrogen} value={data.hydrogenPerHour} onChange={set('hydrogenPerHour')} unit="€/h" note="~10 €/kg, 1 kg ≈ 8 h" />
        <Field label={labels.localTrip} value={data.localTripCost} onChange={set('localTripCost')} unit="€" note="Tartu ja lähiümbrus" size={12} />
      </Section>

      <Section title={labels.pricingRules}>
        <Field label={labels.overhead} value={data.overheadRate} onChange={set('overheadRate')} unit="%" percent note="omahinnast: admin, müük" />
        <Field label={labels.targetMargin} value={data.targetMargin} onChange={set('targetMargin')} unit="%" percent note="müügihinnast, mitte juurdehindlus" />
        <Field label={labels.pilotDiscount} value={data.pilotDiscount} onChange={set('pilotDiscount')} unit="%" percent note="kuni 5 esimest klienti" />
        <Field label={labels.multiDayDiscount} value={data.multiDayDiscount} onChange={set('multiDayDiscount')} unit="%" percent note="alates 3. päevast" />
        <Field label={labels.missionRounding} value={data.missionRounding} onChange={set('missionRounding')} unit="€" note="missioonihind alla" />
        <Field label={labels.extraHourRounding} value={data.extraHourRounding} onChange={set('extraHourRounding')} unit="€" note="lisatunni hind alla" />
      </Section>

      <Section title={labels.pricingSurcharges}>
        <Field label={labels.freeRadius} value={data.freeRadiusKm} onChange={set('freeRadiusKm')} unit="km" note="Tartust, hinnas" />
        <Field label={labels.perKm} value={data.perKmOutsideRadius} onChange={set('perKmOutsideRadius')} unit="€/km" note="edasi-tagasi" />
        <Field label={labels.accommodationFrom} value={data.accommodationFromKm} onChange={set('accommodationFromKm')} unit="km" note="tegeliku kulu järgi" />
        <Field label={labels.nightWeekend} value={data.nightWeekendSurcharge} onChange={set('nightWeekendSurcharge')} unit="%" percent />
        <Field label={labels.rush} value={data.rushSurcharge} onChange={set('rushSurcharge')} unit="%" percent note="alla 24 h ette" />
        <Field label={labels.sensorRental} value={data.sensorRentalMarkup} onChange={set('sensorRentalMarkup')} unit="%" percent note="kulu peale" />
        <Field label={labels.analysis} value={data.analysisPerHour} onChange={set('analysisPerHour')} unit="€/h" size={12} />
      </Section>

      <Section title={labels.pricingMissions}>
        {data.missions.map((mission, index) => (
          <Grid size={12} key={mission.key}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
              {labels.missionNames[mission.key]}
            </Typography>
            <Grid container spacing={1.25}>
              <Field label={labels.onsiteHours} value={mission.onsiteHours} onChange={setMission(index, 'onsiteHours')} unit="h" size={4} />
              <Field label={labels.flightHours} value={mission.flightHours} onChange={setMission(index, 'flightHours')} unit="h" size={4} />
              <Field label={labels.workHours} value={mission.workHoursPerPerson} onChange={setMission(index, 'workHoursPerPerson')} unit="h" size={4} />
            </Grid>
          </Grid>
        ))}
      </Section>

      <Divider sx={{ my: 2 }} />

      {/* ---- what the inputs add up to: the internal view, never shown to a client ---- */}
      <Section title={labels.pricingResult}>
        <Grid size={12}>
          <Readout label={labels.depreciationInPrice} value={euro(result.depreciation)} />
          <Readout label={labels.insuranceTotal} value={euro(result.insurance)} />
          <Readout label={labels.fixedTotal} value={euro(result.fixedTotal)} strong />
          <Readout label={labels.fixedWithoutDepreciation} value={euro(result.fixedWithoutDepreciation)} />
          <Divider sx={{ my: 1 }} />
          <Readout label={labels.fixedPerHourTarget} value={euro2(result.fixedPerHourTarget)} />
          <Readout label={labels.fixedPerHourActual} value={euro2(result.fixedPerHourActual)} />
          <Readout label={labels.cashFixedPerHourActual} value={euro2(result.cashFixedPerHourActual)} />
          <Readout label={labels.crewCostPerHour} value={euro2(result.crewCostPerHour)} strong />
        </Grid>

        <Grid size={12}>
          <Box sx={{ mt: 1.5, overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, '& td, & th': { py: 0.6, px: 1, textAlign: 'right', whiteSpace: 'nowrap' }, '& th:first-of-type, & td:first-of-type': { textAlign: 'left' } }}>
              <Box component="thead" sx={{ '& th': { fontWeight: 600, color: 'text.secondary', borderBottom: 1, borderColor: 'divider', fontSize: 11 } }}>
                <tr>
                  <th>{labels.pricingMission}</th>
                  {result.missions.map((mission) => (
                    <th key={mission.key}>{labels.missionNames[mission.key]}</th>
                  ))}
                </tr>
              </Box>
              <Box component="tbody" sx={{ '& tr td': { borderBottom: 1, borderColor: 'divider' } }}>
                <tr>
                  <td>{labels.costWithOverhead}</td>
                  {result.missions.map((m) => <td key={m.key}>{euro(m.costTarget)}</td>)}
                </tr>
                <tr>
                  <td><strong>{labels.listPrice}</strong></td>
                  {result.missions.map((m) => <td key={m.key}><strong>{euro(m.listPrice)}</strong></td>)}
                </tr>
                <tr>
                  <td>{labels.pilotPrice}</td>
                  {result.missions.map((m) => <td key={m.key}>{euro(m.pilotPrice)}</td>)}
                </tr>
                <tr>
                  <td>{labels.marginTarget}</td>
                  {result.missions.map((m) => <td key={m.key}>{(m.marginTarget * 100).toFixed(1)}%</td>)}
                </tr>
                <tr>
                  <td>{labels.pilotMarginActual}</td>
                  {result.missions.map((m) => (
                    <td key={m.key} style={{ color: m.pilotMarginActual < 0 ? '#b91c1c' : undefined }}>
                      {(m.pilotMarginActual * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>{labels.pilotCashMargin}</td>
                  {result.missions.map((m) => (
                    <td key={m.key} style={{ color: m.pilotCashMarginActual < 0 ? '#b91c1c' : '#15803d' }}>
                      {(m.pilotCashMarginActual * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>
              </Box>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {labels.pricingMarginNote}
          </Typography>
        </Grid>
      </Section>
    </Box>
  );
}
