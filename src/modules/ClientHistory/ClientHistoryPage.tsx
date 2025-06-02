import { Box, TextField, Typography, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClientTable from "./ClientTable.tsx";
import { ClientHistory } from "./TypesHistory.tsx"; 
import React from 'react';


const dummyData: ClientHistory[] = [
    {
      id: '1',
      nombre: 'Ana Torres',
      telefono: '0991234567',
      citasPasadas: 5,
      servicios: ['Manicure', 'Pedicure'],
      alertaSalud: true,
      detalleAlerta: 'Alergia a acrílicos y acetona',

    },
    {
      id: '2',
      nombre: 'Laura Vega',
      telefono: '0987654321',
      citasPasadas: 2,
      servicios: ['Uñas Acrílicas'],
      alertaSalud: false,
    },
  ];

export default function ClientHistoryPage() {
  return (
    <Box sx={{ mt: 11, px: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        HISTORIAL CLIENTE
      </Typography>

      <TextField
        label="Buscar"
        placeholder="Buscar por nombre o teléfono..."
        fullWidth
        sx={{ mb: 4 }}
              InputProps={{
                  endAdornment: <SearchIcon />,
                }}
      />

      <ClientTable rows={dummyData}/>
      <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
      </Stack>
    </Box>
  );
}
