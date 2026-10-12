import React from 'react';
import { Avatar, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const accent = '#1976d2';
const accentLight = '#eef6fd';
const muted = '#64748b';
const line = '#e2e8f0';
const eyebrow = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' };

// Every row the price list can carry, each with a stable key. A row listed in
// `input.hidden` is left out, which is how a quote gets tailored to one client
// without rewriting the model. Passing `all` returns the full set, which is
// what the form needs to draw its checkboxes.
const visible = (rows, input, all) =>
  all ? rows : rows.filter((row) => !(input.hidden || []).includes(row.key));

export const buildPriceRows = (result, input, labels, all = false) => {
  const rows = result.missions.map((mission) => ({
    key: `row:${mission.key}`,
    service: `${labels.missionNames[mission.key]}, ${labels.upTo} ${mission.onsiteHours} h ${labels.onsite}`,
    list: mission.listPrice,
    pilot: mission.pilotPrice,
  }));

  rows.push({ key: 'row:extraHour', service: labels.extraHourRow, list: result.extraHourPrice, pilot: result.extraHourPilotPrice });
  rows.push({ key: 'row:multiDay', service: labels.multiDayRow, list: result.multiDayPrice, pilot: result.multiDayPilotPrice });
  return visible(rows, input, all);
};

export const buildIncludedRows = (input, labels, all = false) =>
  visible(
    [
      { key: 'inc:crew', text: `${labels.includedCrew}: ${input.crewSize} ${labels.includedCrewUnit}` },
      { key: 'inc:planning', text: labels.includedPlanning },
      { key: 'inc:insurance', text: labels.includedInsurance },
      { key: 'inc:sensor', text: labels.includedSensor },
      { key: 'inc:data', text: labels.includedData },
      { key: 'inc:travel', text: `${labels.includedTravel} ${input.freeRadiusKm} km` },
      { key: 'inc:weather', text: labels.includedWeather },
    ],
    input,
    all
  );

export const buildExtraRows = (input, labels, all = false) =>
  visible(
    [
      { key: 'ext:travel', label: `${labels.extraTravel} ${input.freeRadiusKm} km`, value: `${Number(input.perKmOutsideRadius).toFixed(2)} €/km` },
      { key: 'ext:accommodation', label: `${labels.extraAccommodation} ${input.accommodationFromKm} km`, value: labels.atCost },
      { key: 'ext:night', label: labels.extraNight, value: `+${Math.round(input.nightWeekendSurcharge * 100)}%` },
      { key: 'ext:rush', label: labels.extraRush, value: `+${Math.round(input.rushSurcharge * 100)}%` },
      { key: 'ext:sensor', label: labels.extraSensor, value: `${labels.cost} +${Math.round(input.sensorRentalMarkup * 100)}%` },
      { key: 'ext:analysis', label: labels.extraAnalysis, value: `${Math.round(input.analysisPerHour)} €/h` },
    ],
    input,
    all
  );

export default function PriceList({ input, result, labels, company, scale = 1 }) {
  const money = (value) => `${Math.round(Number(value) || 0).toLocaleString('et-EE')} €`;
  const priceRows = buildPriceRows(result, input, labels);
  const included = buildIncludedRows(input, labels);
  const extras = buildExtraRows(input, labels);

  return (
    <div
      id="price-list-preview"
      style={{
        boxSizing: 'border-box',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: 794,
        margin: '0 auto',
        padding: 24,
        backgroundColor: 'transparent',
        color: '#1f2937',
        fontSize: 11,
        lineHeight: 1.6,
      }}
    >
      <Box sx={{ border: `1px solid ${line}`, borderRadius: 3, overflow: 'hidden', bgcolor: '#fff' }}>
        <Box sx={{ height: 6, background: `linear-gradient(to right, ${accent}, #c026d3)` }} />

        <Box sx={{ p: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
              <Avatar
                src={company.logoUrl || `${process.env.PUBLIC_URL}/logo.png`}
                alt=""
                crossOrigin="anonymous"
                sx={{ mr: 2, width: 56, height: 56, flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={700} color="#1f2937" sx={{ fontSize: '1.5rem', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  {company.name}
                </Typography>
                {hasValue(company.address) && (
                  <Typography variant="body2" sx={{ color: muted, mt: 0.25 }}>{company.address}</Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: accent, fontSize: '2rem', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                {labels.priceListTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: muted, mt: 0.5 }}>{labels.priceListSubtitle}</Typography>
            </Box>
          </Box>

          <TableContainer sx={{ mb: 4, border: `1px solid ${line}`, borderRadius: 1.5, overflow: 'hidden' }}>
            <Table
              size="small"
              sx={{
                '& th': { bgcolor: accent, color: '#fff', fontWeight: 700, fontSize: 12, borderBottom: 0 },
                '& td': { color: '#1f2937', borderBottom: `1px solid #eef2f6` },
                '& tbody tr:last-child td': { borderBottom: 0 },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>{labels.service}</TableCell>
                  <TableCell align="right">{labels.listPriceColumn}</TableCell>
                  <TableCell align="right">{labels.pilotPriceColumn}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell sx={{ py: 1.5, fontWeight: 700 }}>{row.service}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>{money(row.list)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, color: accent }}>{money(row.pilot)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="caption" sx={{ color: muted, display: 'block', mb: 4 }}>
            {`${labels.pilotNotePrefix}${Math.round(input.pilotDiscount * 100)}${labels.pilotNoteSuffix}`}
          </Typography>

          {(included.length > 0 || extras.length > 0) && (
            <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
              {included.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 260, bgcolor: accentLight, borderLeft: `4px solid ${accent}`, borderRadius: 1, px: 2.5, py: 2 }}>
                  <Typography sx={{ ...eyebrow, color: accent, mb: 1 }}>{labels.included}</Typography>
                  {included.map((item) => (
                    <Typography key={item.key} variant="body2" sx={{ color: '#1f2937', mb: 0.5 }}>• {item.text}</Typography>
                  ))}
                </Box>
              )}

              {extras.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography sx={{ ...eyebrow, color: muted, mb: 1 }}>{labels.extraServices}</Typography>
                  {extras.map((extra) => (
                    <Box key={extra.key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5, borderBottom: `1px solid ${line}` }}>
                      <Typography variant="body2" sx={{ color: '#1f2937' }}>{extra.label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>{extra.value}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          <Typography variant="caption" sx={{ color: muted }}>{labels.priceListFooter}</Typography>
        </Box>
      </Box>
    </div>
  );
}
