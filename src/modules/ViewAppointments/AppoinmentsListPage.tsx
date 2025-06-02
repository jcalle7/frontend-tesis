import { Box, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AppointmentTable from "./AppoinmentsTable.tsx";
import { AppointmentData } from "./TypesCitas.tsx";
import { useState } from 'react';
import React from 'react';

const dummyAppointments: AppointmentData[] = [
  { id: '1', nombre: 'Ana Torres', estado: 'Pendiente', fecha: '15/05/2025', hora: '12:00' },
  { id: '2', nombre: 'Laura Vega', estado: 'Aceptada', fecha: '16/05/2025', hora: '14:00' },
  { id: '3', nombre: 'Carlos Pérez', estado: 'Cancelada', fecha: '17/05/2025', hora: '10:00' },
];

export default function AppointmentListPage() {
  const [appointments, setAppointments] = useState(dummyAppointments);

  const handleAccept = (id: string) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, estado: 'Aceptada' } : appt))
    );
  };

  const handleCancel = (id: string) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, estado: 'Cancelada' } : appt))
    );
  };

  return (
    <Box sx={{ mt: 11, px: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        VER CITA
      </Typography>

      <TextField
        label="Buscar cliente"
        placeholder="Buscar cliente..."
        fullWidth
        sx={{ mb: 4 }}
        InputProps={{ endAdornment: <SearchIcon /> }}
      />

      <AppointmentTable rows={appointments} onAccept={handleAccept} onCancel={handleCancel} />
    </Box>
  );
}
