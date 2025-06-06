import { Typography, Box } from '@mui/material';
import AllergyFormData from "./AllergyForm.tsx";
import { containerStylesAllergy, titleStylesAllergy } from "./Styles/AllergyClientPage.styles.ts";
import React from 'react';

export default function AllergyClientPage() {
  return (
    <Box sx={ containerStylesAllergy }>
      <Typography variant="h4" sx={titleStylesAllergy}>
        CREAR FORMULARIOS
      </Typography>
      <AllergyFormData />
    </Box>
  );
}
