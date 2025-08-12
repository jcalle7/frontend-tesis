import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Stack, Alert, DialogContentText, Box
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { supabase } from '../../../components/lib/supabaseClient';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (fechaISO: string, comprobante: File | null) => void;
  selectedServices: any[];
  bankAccount: string;
  companyId: string;
  idNumber?: string;
}

function AvailabilityGrid({
  companyId,
  serviceIds,
  onPick
}: {
  companyId: string;
  serviceIds: string[];
  onPick: (iso: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    let d = dayjs();
    if (d.day() === 0) d = d.add(1, 'day'); // sin domingos
    return d.startOf('day');
  });
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [requiredSlots, setRequiredSlots] = useState(1);
  const [pickedISO, setPickedISO] = useState<string | null>(null);

  // Duración total de los servicios seleccionados (igual que admin)
  useEffect(() => {
    (async () => {
      if (!serviceIds.length) return;
      const { data } = await supabase
        .from('services')
        .select('id, duration_minutes')
        .in('id', serviceIds);

      const total = (data ?? []).reduce(
        (acc, s: any) => acc + (Number(s?.duration_minutes) || 30),
        0
      );
      const minutos = Math.max(30, total || 30);
      setRequiredSlots(Math.max(1, Math.ceil(minutos / 30)));
    })();
  }, [serviceIds]);

  // Ocupados por compañía y día (mismo query del admin)
  useEffect(() => {
    (async () => {
      if (!companyId) return;
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const { data: occ, error } = await supabase.rpc('get_day_occupancy', {
        p_company_id: companyId,
        p_date: dateStr
      });
      if (error) {
        console.error('Ocupación RPC error', error);
        setBookedTimes(new Set());
        return;
      }

      const occupied = new Set<string>();
      (occ || []).forEach(({ slot_time, blocks }: any) => {
        let slot = dayjs(`${dateStr}T${slot_time}`);
        for (let i = 0; i < Number(blocks || 1); i++) {
          occupied.add(slot.format('HH:mm:ss'));
          slot = slot.add(30, 'minute');
        }
      });

      setBookedTimes(occupied);
    })();
  }, [companyId, selectedDate]);

  // Slots 07:00–20:30
  const ALL_SLOTS = useMemo(() => {
    const out: { label: string; time: string }[] = [];
    for (let h = 7; h < 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        out.push({ label: `${hh}:${mm}`, time: `${hh}:${mm}:00` });
      }
    }
    return out;
  }, []);

  const slotAvailable = (startLabel: string) => {
    let start = selectedDate
      .hour(parseInt(startLabel.slice(0, 2)))
      .minute(parseInt(startLabel.slice(3, 5)))
      .second(0);

    for (let i = 0; i < requiredSlots; i++) {
      const t = start.format('HH:mm:ss');
      const outOfHours =
        start.hour() < 7 || start.hour() >= 21 || (start.minute() !== 0 && start.minute() !== 30);
      const isPastToday =
        selectedDate.isSame(dayjs(), 'day') && start.isBefore(dayjs());
      if (outOfHours || isPastToday || bookedTimes.has(t)) return false;
      start = start.add(30, 'minute');
    }
    return true;
  };

  return (
    <Stack spacing={2}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Seleccionar fecha"
          value={selectedDate}
          onChange={(val) => {
            if (!val) return;
            if (val.day() === 0) return;
            setPickedISO(null);
            setSelectedDate(val.startOf('day'));
          }}
          disablePast
          shouldDisableDate={(d) => d.day() === 0}
        />
      </LocalizationProvider>

      <Stack direction="row" spacing={2} sx={{ fontSize: 13 }}>
        <span>🟩 Disponible</span>
        <span>🟥 Ocupado</span>
        <span>⬜ Pasado (hoy)</span>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 1 }}>
        {ALL_SLOTS.map(({ label, time }) => {
          const slotDT = selectedDate
            .hour(parseInt(label.slice(0, 2)))
            .minute(parseInt(label.slice(3, 5)))
            .second(0);

          const isBooked = bookedTimes.has(time);
          const isPastToday =
          selectedDate.isSame(dayjs(), 'day') && slotDT.isBefore(dayjs());

          const available = slotAvailable(label);
          const selected =
            pickedISO &&
            dayjs(pickedISO).format('YYYY-MM-DD HH:mm:ss') ===
              `${selectedDate.format('YYYY-MM-DD')} ${time}`;

          return (
            <Button
              key={time}
              variant={selected ? 'contained' : 'outlined'}
              color={available ? 'success' : 'error'}
              disabled={!available}
              onClick={() => {
                if (!available) return;
                const dt = slotDT.toISOString();
                setPickedISO(dt);
                onPick(dt);
              }}
              sx={{
                textTransform: 'none',
                ...(isBooked && {
                  '&.Mui-disabled': {
                    bgcolor: '#fde7e9',
                    borderColor: '#f4a3a9',
                    color: '#b71c1c',
                  },
                }),
                ...(isPastToday && {
                  '&.Mui-disabled': {
                    bgcolor: '#f4f4f5',
                    borderColor: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }),
              }}
            >
              {label}
            </Button>
          );
        })}
      </Box>
    </Stack>
  );
}

export default function AppointmentModal({
  open, onClose, onConfirm,
  selectedServices, bankAccount, companyId, idNumber
}: AppointmentModalProps) {
  const [fechaISO, setFechaISO] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const uuidRe = /^[0-9a-fA-F-]{36}$/;
  const serviceIds: string[] = selectedServices
    .map((s) => (typeof s?.id === 'object' ? s?.id?.id : s?.id))
    .filter((id: any): id is string => typeof id === 'string' && uuidRe.test(id));

  const ready = Boolean(companyId && serviceIds.length > 0); 

  const handleConfirmClick = () => {
    if (!fechaISO) return alert('Selecciona la fecha y hora');
    setConfirmOpen(true);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Agendar cita para: {selectedServices.map(s => s.name).join(', ')}</DialogTitle>
        <DialogContent dividers>
          <Typography mb={2}>Debes depositar el 50% del servicio al siguiente número de cuenta:</Typography>
          <Alert severity="info" sx={{ mb: 2, fontWeight: 500 }}>
            {bankAccount && <DialogContentText>Cuenta: {bankAccount}</DialogContentText>}
            {idNumber && <DialogContentText>Cédula/RUC: {idNumber}</DialogContentText>}
          </Alert>

          {ready ? (
            <AvailabilityGrid
              companyId={companyId}
              serviceIds={serviceIds}
              onPick={(iso) => setFechaISO(iso)}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Selecciona al menos un servicio y espera a que cargue la agenda…
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" color="error">Cancelar</Button>
          <Button onClick={handleConfirmClick} variant="contained" color="primary">Confirmar cita</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>⚠️ Confirmación de cita</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Recuerda que debes realizar el pago del 50% para confirmar tu cita.
          </DialogContentText>

          <Button variant="outlined" component="label" color="success" sx={{ fontWeight: 500 }}>
            Seleccionar comprobante de pago
            <input type="file" hidden accept="image/*" onChange={(e) => {
              if (e.target.files?.[0]) setComprobante(e.target.files[0]);
            }}/>
          </Button>

          {comprobante && <Typography variant="body2" color="text.secondary" mt={1}>Archivo: {comprobante.name}</Typography>}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="error">Cancelar</Button>
          <Button
            onClick={() => {
              if (!comprobante) return alert('Debes seleccionar el comprobante');
              onConfirm(fechaISO!, comprobante);
              setConfirmOpen(false);
            }}
            variant="contained"
            color="primary"
          >
            Entiendo y continuar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
