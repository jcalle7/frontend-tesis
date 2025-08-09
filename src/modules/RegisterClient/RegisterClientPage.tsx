import { Typography, Box } from '@mui/material';
import ClientForm from "./ClientForm.tsx";
import { containerStyles, titleStyles } from "./Styles/RegisterClientPage.styles.ts";

export default function RegisterClientPage() {
  return (
    <Box sx={ containerStyles }>
      <Typography variant="h4" sx={titleStyles}>
        REGISTRAR CLIENTE
      </Typography>
      <ClientForm />
    </Box>
  );
}
  