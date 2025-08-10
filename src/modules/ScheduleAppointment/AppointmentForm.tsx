import {
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Snackbar,
  Autocomplete,
  Stack,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useEffect, useMemo, useState } from 'react';
import { AppointmentFormData, Cliente, Servicio } from '../ScheduleAppointment/TypesAppointment.tsx';
import {
  formContainerAppointment,
  buttonGroupAppoinment,
  buttonStyleAppointment,
} from '../ScheduleAppointment/Styles/AppointmentForm.styles.ts';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { supabase } from '../../components/lib/supabaseClient.ts';

export default function AppointmentForm() {
  const makeInitialDate = () => {
    let d = dayjs();
    if (d.day() === 0) d = d.add(1, 'day');
    return d.hour(7).minute(0).second(0).millisecond(0);
  };
  const initialDate = makeInitialDate();

  const [formData, setFormData] = useState<AppointmentFormData>({
    cliente: '',
    servicios: [],
    fechaHora: initialDate.toISOString(),
  });

  const [selectedDate, setSelectedDate] = useState<Dayjs>(initialDate.startOf('day'));
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set()); // 'HH:mm:ss' ocupados (expandidos por duración)
  const [telefono, setTelefono] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const generateSlots = (startHour = 7, endHour = 21, stepMin = 30) => {
    const out: { label: string; time: string }[] = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += stepMin) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        out.push({ label: `${hh}:${mm}`, time: `${hh}:${mm}:00` });
      }
    }
    return out;
  };
  const ALL_SLOTS = useMemo(() => generateSlots(), []);

  const totalDuration = useMemo(() => {
    const chosen = servicios.filter((s) => formData.servicios.includes(s.id));
    const sum = chosen.reduce(
      (acc, s) => acc + (Number((s as any).duration_minutes) || 30),
      0
    );
    return Math.max(30, sum || 30);
  }, [servicios, formData.servicios]);

  const requiredSlots = useMemo(() => Math.max(1, Math.ceil(totalDuration / 30)), [totalDuration]);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      if (!userId) return;

      const { data: empresaData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', userId)
        .single();

      if (empresaData?.company_id) {
        const cid = empresaData.company_id;
        setCompanyId(cid);

        const { data: clientesData } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', cid);
        const { data: serviciosData } = await supabase
          .from('services')
          .select('*')
          .eq('company_id', cid);

        setClientes(clientesData || []);
        setServicios(serviciosData || []);
      } else {
        setSnackbar({
          open: true,
          message: '⚠️ No se encontró la empresa asociada.',
          severity: 'error',
        });
        return;
      }

      setCargandoDatos(false);
    };

    fetchAll();
  }, []);

  useEffect(() => {
    (async () => {
      if (!companyId) return;
      const dateStr = selectedDate.format('YYYY-MM-DD');

      const { data: apps } = await supabase
        .from('appointments')
        .select('id, time, status, appointment_services(services(duration_minutes))')
        .eq('company_id', companyId)
        .eq('date', dateStr)
        .in('status', ['pendiente', 'aceptada']);

      const occupied = new Set<string>();
      (apps || []).forEach((a: any) => {
        const serviceDurations: number[] =
          (a?.appointment_services || []).map(
            (as: any) =>
              Number(as?.services?.duration_minutes ?? as?.service?.duration_minutes ?? 0)
          ) || [];
        const dur = Math.max(
          30,
          serviceDurations.reduce((acc, v) => acc + (Number(v) || 0), 0) || 30
        );
        const n = Math.max(1, Math.ceil(dur / 30));

        let slot = dayjs(`${dateStr}T${a.time}`);
        for (let i = 0; i < n; i++) {
          occupied.add(slot.format('HH:mm:ss'));
          slot = slot.add(30, 'minute');
        }
      });

      if ((apps || []).length && occupied.size === 0) {
        (apps || []).forEach((a: any) => occupied.add(a.time));
      }

      setBookedTimes(occupied);
    })();
  }, [companyId, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const { cliente, servicios: serviciosSeleccionados, fechaHora } = formData;

    if (!cliente || serviciosSeleccionados.length === 0 || !fechaHora || !telefono.trim()) {
      setError('Por favor completa todos los campos antes de guardar.');
      return;
    }

    if (!companyId) {
      console.error('❌ companyId es null o undefined');
      setError('No se pudo obtener la empresa del usuario.');
      return;
    }

    const dt = dayjs(fechaHora);
    if (!dt.isValid()) return setError('Selecciona una fecha y hora válidas.');

    if (dt.day() === 0) return setError('Los domingos no se agendan citas.');

    const hour = dt.hour(),
      minute = dt.minute();
    const inWindow = hour >= 7 && hour < 21 && (minute === 0 || minute === 30);
    if (!inWindow)
      return setError(
        'Solo se agendan citas entre 07:00 y 21:00 en intervalos de 30 minutos.'
      );

    const timesToCheck: string[] = [];
    let cursor = dt.clone();
    for (let i = 0; i < requiredSlots; i++) {
      timesToCheck.push(cursor.format('HH:mm:ss'));
      cursor = cursor.add(30, 'minute');
    }

    setLoading(true);
    try {
      const { data: overlapping } = await supabase
        .from('appointments')
        .select('id, time')
        .eq('company_id', companyId)
        .eq('date', dt.format('YYYY-MM-DD'))
        .in('time', timesToCheck)
        .in('status', ['pendiente', 'aceptada']);

      if ((overlapping || []).length > 0) {
        setError('⚠️ El horario elegido se cruza con otra cita. Elige otro.');
        setLoading(false);
        return;
      }

      const { data: appointment, error: errorCita } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: cliente,
            company_id: companyId,
            phone: telefono,
            date: dt.format('YYYY-MM-DD'),
            time: dt.format('HH:mm:ss'),
            status: 'aceptada', 
          },
        ])
        .select()
        .single();

      if (errorCita) throw errorCita;

      const relaciones = serviciosSeleccionados.map((id) => ({
        appointment_id: appointment.id,
        service_id: id,
      }));
      const { error: errorRel } = await supabase
        .from('appointment_services')
        .insert(relaciones);
      if (errorRel) throw errorRel;

      setSuccessMessage('✅ Cita agendada y aceptada.');

      setBookedTimes((prev) => {
        const next = new Set(prev);
        timesToCheck.forEach((t) => next.add(t));
        return next;
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`❌ Error al guardar: ${errorMsg}`);
      console.error('Error al guardar cita:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!telefono.trim()) {
      setError('Debes ingresar un número de teléfono para enviar el WhatsApp.');
      return;
    }

    const clienteNombre = clientes.find((c) => c.id === formData.cliente);
    const nombre = clienteNombre
      ? `${clienteNombre.first_name} ${clienteNombre.last_name}`
      : 'cliente';
    const mensaje = `Hola ${nombre}, tu cita está agendada para el ${dayjs(
      formData.fechaHora
    ).format('DD/MM/YYYY HH:mm')}.`;
    const whatsappURL = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
      mensaje
    )}`;
    globalThis.open(whatsappURL, '_blank');
  };

  if (cargandoDatos) return <CircularProgress />;

  const isSelected = (time: string) =>
    formData.fechaHora &&
    dayjs(formData.fechaHora).format('YYYY-MM-DD HH:mm:ss') ===
      `${selectedDate.format('YYYY-MM-DD')} ${time}`;

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
    <Box component="form" onSubmit={handleSubmit} sx={formContainerAppointment}>
      {/* Cliente */}
      <Autocomplete
        options={clientes}
        getOptionLabel={(option) =>
          option.first_name && option.last_name
            ? `${option.first_name} ${option.last_name}`
            : 'Cliente sin nombre'
        }
        value={clientes.find((c) => c.id === formData.cliente) || null}
        onChange={(_, newValue) => {
          setFormData((prev) => ({ ...prev, cliente: newValue?.id || '' }));
          setTelefono(newValue?.phone ? String(newValue.phone) : '');
        }}
        renderInput={(params) => <TextField {...params} label="Buscar cliente" />}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        sx={{ mb: 2 }}
      />

      {/* Servicios */}
      <Autocomplete
        multiple
        options={servicios}
        getOptionLabel={(option) => option.name ?? 'Servicio sin nombre'}
        value={servicios.filter((s) => formData.servicios.includes(s.id))}
        onChange={(_, newValue) =>
          setFormData((prev) => ({ ...prev, servicios: newValue.map((s) => s.id) }))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Seleccionar servicio(s) — duración total: ${totalDuration} min`}
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        sx={{ mb: 2 }}
      />

      {/* Teléfono */}
      <TextField
        fullWidth
        label="Teléfono (formato internacional E.164)"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Ej: +593999999999 o 593999999999"
        margin="normal"
      />

      {/* Fecha + disponibilidad */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Seleccionar fecha"
          value={selectedDate}
          onChange={(val) => {
            if (!val) return;
            if (val.day() === 0) return; 
            const dayOnly = val.startOf('day');
            setSelectedDate(dayOnly);
            const dt = dayOnly.hour(7).minute(0).second(0);
            setFormData((prev) => ({ ...prev, fechaHora: dt.toISOString() }));
          }}
          disablePast
          shouldDisableDate={(date) => date.day() === 0}
        />
      </LocalizationProvider>

      {/* Leyenda */}
      <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 1, fontSize: 13 }}>
        <span>🟩 Disponible</span>
        <span>🟥 Ocupado</span>
        <span>⬜ Pasado (hoy)</span>
      </Stack>

      {/* Grid de horas 07:00–20:30 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
          gap: 1,
          mb: 2,
        }}
      >
        {ALL_SLOTS.map(({ label, time }) => {
            const slotDT = selectedDate
              .hour(parseInt(label.slice(0, 2)))
              .minute(parseInt(label.slice(3, 5)))
              .second(0);
 
            const isBooked = bookedTimes.has(time);
            const isPastToday = selectedDate.isSame(dayjs(), 'day') && slotDT.isBefore(dayjs()); 
            const selected = formData.fechaHora &&
              dayjs(formData.fechaHora).format('YYYY-MM-DD HH:mm:ss') ===
              `${selectedDate.format('YYYY-MM-DD')} ${time}`;
            const available = slotAvailable(label); 

            return (
            <Button
              key={time}
              variant={isSelected(time) ? 'contained' : 'outlined'}
              color={available ? 'success' : 'error'}   // ← disponible = verde
              disabled={!available}
              onClick={() => {
                if (!available) return;
              const dt = selectedDate
              .hour(parseInt(label.slice(0, 2)))
              .minute(parseInt(label.slice(3, 5)))
              .second(0);
              setFormData(prev => ({ ...prev, fechaHora: dt.toISOString() }));
            }}

            sx={{
            textTransform: 'none',
            // 🔴 Estilo para OCUPADO (aunque esté disabled)
        ...(isBooked && {
          '&.Mui-disabled': {
            bgcolor: '#fde7e9',      // rojo muy claro
            borderColor: '#f4a3a9',
            color: '#b71c1c',
          },
        }),
        // ⚪ Estilo para PASADO (hoy)
        ...(isPastToday && {
          '&.Mui-disabled': {
            bgcolor: '#f4f4f5',      // gris claro
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

      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mt: 1 }}>{successMessage}</Alert>}

      <Box sx={buttonGroupAppoinment}>
        <Button
          type="submit"
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          sx={buttonStyleAppointment}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'GUARDAR'}
        </Button>

        <Button
          variant="outlined"
          color="success"
          startIcon={<WhatsAppIcon />}
          sx={buttonStyleAppointment}
          onClick={handleSendWhatsApp}
          disabled={!formData.cliente || formData.servicios.length === 0 || !telefono.trim()}
        >
          Enviar Mensaje WhatsApp
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
