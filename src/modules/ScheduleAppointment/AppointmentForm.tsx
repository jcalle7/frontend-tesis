import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { Autocomplete } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useState } from 'react';
import { AppointmentFormData } from "./TypesAppointment.tsx";
import { formContainerAppointment, buttonGroupAppoinment, buttonStyleAppointment } from "./Styles/AppointmentForm.styles.ts";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs'; 
import React from 'react';

const mockClientes = [
  { id: 1, nombre: 'María López' },
  { id: 2, nombre: 'Carlos Pérez' },
  { id: 3, nombre: 'Ana García' },
];

const mockServicios = [
  { id: 1, nombre: 'Limpieza facial' },
  { id: 2, nombre: 'Depilación láser' },
  { id: 3, nombre: 'Masaje relajante' },
];

export default function AppointmentForm() {
  const [formData, setFormData] = useState<AppointmentFormData>({
    cliente: '',
    servicio: '',
    fechaHora: dayjs().toISOString(),
  });

  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue) {
    setFormData((prev) => ({ ...prev, fechaHora: newValue.toISOString() }));
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.cliente || !formData.servicio || !formData.fechaHora || !telefono.trim()) {
      setError('Por favor completa todos los campos antes de guardar.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      console.log('Datos de cita:', { ...formData, telefono });
      setSuccessMessage(`Cita agendada exitosamente para ${formData.cliente} el ${dayjs(formData.fechaHora).format('DD/MM/YYYY HH:mm')}`);
      setLoading(false);
    }, 1000);
  };

  const handleSendWhatsApp = () => {
    if (!telefono.trim()) {
      setError('Debes ingresar un número de teléfono para enviar el WhatsApp.');
      return;
    }

    const mensaje = `Hola ${formData.cliente}, tu cita para ${formData.servicio} está agendada el ${dayjs(formData.fechaHora).format('DD/MM/YYYY HH:mm')}.`;
    const whatsappURL = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    globalThis.open(whatsappURL, '_blank');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={formContainerAppointment}>
      <Autocomplete
        options={mockClientes}
        getOptionLabel={(option) => option.nombre}
        value={mockClientes.find((c) => c.nombre === formData.cliente) || null}
        onChange={(_, newValue) => setFormData((prev) => ({ ...prev, cliente: newValue?.nombre || '' }))}
        renderInput={(params) => <TextField {...params} label="Buscar cliente" placeholder="Buscar cliente" />}
      />

      <Autocomplete
        options={mockServicios}
        getOptionLabel={(option) => option.nombre}
        value={mockServicios.find((s) => s.nombre === formData.servicio) || null}
        onChange={(_, newValue) => setFormData((prev) => ({ ...prev, servicio: newValue?.nombre || '' }))}
        renderInput={(params) => <TextField {...params} label="Seleccionar servicio" placeholder="Seleccionar servicio" />}
      />

      <TextField
        fullWidth
        label="Número de teléfono (sin espacios ni símbolos)"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Ej: 5491123456789"
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

      {formData.cliente && formData.servicio && formData.fechaHora && telefono && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '8px' }}>
          <Typography variant="subtitle1">Resumen de la cita:</Typography>
          <Typography>Cliente: {formData.cliente}</Typography>
          <Typography>Teléfono: {telefono}</Typography>
          <Typography>Servicio: {formData.servicio}</Typography>
          <Typography>Fecha y Hora: {dayjs(formData.fechaHora).format('DD/MM/YYYY HH:mm')}</Typography>
        </Box>
      )}

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
          disabled={!formData.cliente || !formData.servicio || !telefono.trim()}
        >
          Enviar WhatsApp
        </Button>

        <Button variant="outlined" color="error" sx={buttonStyleAppointment}>
          CANCELAR
        </Button>
      </Box>
    </Box>
  );
}
