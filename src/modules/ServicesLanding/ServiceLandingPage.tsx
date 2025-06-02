import { Typography, Box } from '@mui/material';
import ServiceForm from "./ServiceForm.tsx";
import { containerStylesServices, titleStylesServices } from "./Styles/ServiceLandingPage.styles.ts";
import React from 'react';

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
