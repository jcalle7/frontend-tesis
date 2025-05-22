import { Typography, Box } from '@mui/material';
import ServiceForm from '../ServicesLanding/ServiceForm';
import { containerStylesServices, titleStylesServices } from './Styles/ServiceLandingPage.styles';

export default function ServiceLandingPage() {
  return (
    <Box sx={ containerStylesServices }>
      <Typography variant="h4" sx={titleStylesServices}>
        CREAR SERVICIOS
      </Typography>
      <ServiceForm />
    </Box>
  );
}
