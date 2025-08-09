import { Box, Button, TextField, Alert, CircularProgress, Snackbar } from '@mui/material';
import { Autocomplete } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useEffect, useState } from 'react';
import { AppointmentFormData, Cliente, Servicio } from '../ScheduleAppointment/TypesAppointment.tsx';
import { formContainerAppointment, buttonGroupAppoinment, buttonStyleAppointment } from '../ScheduleAppointment/Styles/AppointmentForm.styles.ts';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { supabase } from '../../components/lib/supabaseClient.ts'; 
import type { Dayjs } from 'dayjs';

export default function AppointmentForm() {
  const [formData, setFormData] = useState<AppointmentFormData>({
    cliente: '',
    servicios: [],
    fechaHora: dayjs().toISOString(),
  });
  const [telefono, setTelefono] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const fetchAll = async () => {
      const { data: user } = await supabase.auth.getUser();
      console.log('👤 Usuario actual:', user?.user?.id);
      const userId = user?.user?.id;
      if (!userId) return;

      const { data: empresaData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', userId)
        .single();
        console.log('🔍 Resultado de consulta a company_users:', empresaData);

      if (empresaData?.company_id) {
        const companyId = empresaData.company_id;
      setCompanyId(companyId);
      } else {
      setSnackbar({ open: true, message: '⚠️ No se encontró la empresa asociada.', severity: 'error' });
      return;
    }
    
    if (!empresaData) return;


      const { data: clientesData } = await supabase.from('clients').select('*');
      const { data: serviciosData } = await supabase.from('services').select('*').eq('company_id', empresaData.company_id);
      setClientes(clientesData || []);
      setServicios(serviciosData || []);
      setCargandoDatos(false);
    };

    fetchAll();
  }, []);

  const handleDateChange: NonNullable<DateTimePickerProps<Dayjs>['onChange']> = (newValue) => {
  if (newValue) {
    setFormData((prev) => ({ ...prev, fechaHora: newValue.toISOString() }));
  }
  };

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

    setLoading(true);

    try {
     //Validación contra sobre-agendamiento
      const { data: citaExistente, error: _errorConsulta } = await supabase
      .from('appointments')
      .select('id')
      .eq('company_id', companyId)
      .eq('date', dayjs(fechaHora).format('YYYY-MM-DD'))
      .eq('time', dayjs(fechaHora).format('HH:mm:ss'))
      .maybeSingle();

      if (citaExistente) {
        setError('⚠️ Ya existe una cita agendada en esta fecha y hora. Elige otro horario.');
        setLoading(false);
        return;
      }

      console.log('Datos para insertar en appointments:');
      
      console.log({
        client_id: cliente,
        company_id: companyId,
        phone: telefono,
        date: dayjs(fechaHora).format('YYYY-MM-DD'),
        time: dayjs(fechaHora).format('HH:mm:ss'),
        status: 'pendiente',
      });

      const { data: appointment, error: errorCita } = await supabase
        .from('appointments')
        .insert([{
          client_id: cliente,
          company_id: companyId,
          phone: telefono,
          date: dayjs(fechaHora).format('YYYY-MM-DD'),
          time: dayjs(fechaHora).format('HH:mm:ss'),
          status: 'pendiente',
        }])
        .select()
        .single();

      if (errorCita) throw errorCita;

      const relaciones = serviciosSeleccionados.map(id => ({
        appointment_id: appointment.id,
        service_id: id,
      }));

      const { error: errorRel } = await supabase.from('appointment_services').insert(relaciones);
      if (errorRel) throw errorRel;

      setSuccessMessage('✅ Cita agendada correctamente.');
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

    const clienteNombre = clientes.find(c => c.id === formData.cliente);
    const nombre = clienteNombre ? `${clienteNombre.first_name} ${clienteNombre.last_name}` : 'cliente';
    const mensaje = `Hola ${nombre}, tu cita está agendada para el ${dayjs(formData.fechaHora).format('DD/MM/YYYY HH:mm')}.`;
    const whatsappURL = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    globalThis.open(whatsappURL, '_blank');
  };

  if (cargandoDatos) return <CircularProgress />;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={formContainerAppointment}>
      <Autocomplete
        options={clientes}
        getOptionLabel={(option) =>
          option.first_name && option.last_name
            ? `${option.first_name} ${option.last_name}`
            : 'Cliente sin nombre'
        }
        value={clientes.find(c => c.id === formData.cliente) || null}
        onChange={(_, newValue) =>
          setFormData((prev) => ({ ...prev, cliente: newValue?.id || '' }))
        }
        renderInput={(params) => <TextField {...params} label="Buscar cliente" />}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />

      <Autocomplete
        multiple
        options={servicios}
        getOptionLabel={(option) => option.name ?? 'Servicio sin nombre'}
        value={servicios.filter(s => formData.servicios.includes(s.id))}
        onChange={(_, newValue) =>
          setFormData((prev) => ({ ...prev, servicios: newValue.map((s) => s.id) }))
        }
        renderInput={(params) => <TextField {...params} label="Seleccionar servicio(s)" />}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />

      <TextField
        fullWidth
        label="Número de teléfono (sin espacios ni símbolos)"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Ej: 593999999999"
        margin="normal"
      />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker
          label="Seleccionar fecha y hora"
          value={dayjs(formData.fechaHora)}
          onChange={handleDateChange}
        />
      </LocalizationProvider>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}

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
          Enviar WhatsApp
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