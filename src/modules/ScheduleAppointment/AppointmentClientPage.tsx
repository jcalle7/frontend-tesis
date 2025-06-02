import { Typography, Box } from '@mui/material';
import { containerStylesAppoinment, titleStylesAppointment } from "./Styles/AppoinmentClientPage.styles.ts";
import AppointmentForm from "./AppointmentForm.tsx";
import React from 'react';

export default function AppointmentLandingPage() {
  return (
    <Box sx={ containerStylesAppoinment }>
      <Typography variant="h4" sx={titleStylesAppointment}>
        AGENDAR CITA
      </Typography>
      <AppointmentForm />
    </Box>
  );
}
