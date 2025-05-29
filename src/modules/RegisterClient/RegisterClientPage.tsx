import { Typography, Box } from '@mui/material';
import ClientForm from '../RegisterClient/ClientForm';
import { containerStyles, titleStyles } from '../RegisterClient/Styles/RegisterClientPage.styles';

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
  