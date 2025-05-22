import { Typography, Box } from '@mui/material';
import { containerStylesAppoinment, titleStylesAppointment } from './Styles/AppoinmentClientPage.styles';
import AppointmentForm from './AppointmentForm';

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
