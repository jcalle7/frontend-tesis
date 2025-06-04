import { useEffect, useState } from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Typography, Box, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import React from "react";
import { Client } from './TypesListClient.tsx'; 
import { containerStylesList, titleStylesList } from "./Styles/ClientListPage.styles.ts";

export default function ClientListPage() {
const [clients, setClients] = useState<Client[]>([]);
const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
  open: false,
  message: '',
  severity: 'success',
});
const [_companyId, setCompanyId] = useState<string | null>(null);

  const fetchClients = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return;

    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.user.id)
      .single();

    if (!companyUser) return;

    setCompanyId(companyUser.company_id);

    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyUser.company_id);

    if (clientsData) {
      setClients(clientsData);
    } else if (error) {
      setSnackbar({ open: true, message: 'Error al obtener clientes.', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      setSnackbar({ open: true, message: 'Error al eliminar cliente.', severity: 'error' });
    } else {
      setClients((prev) => prev.filter((c) => c.id !== id));
      setSnackbar({ open: true, message: 'Cliente eliminado.', severity: 'success' });
    }
  };

  return (
    <Box sx={ containerStylesList }>
    <Typography variant="h4" sx={titleStylesList}>
        LISTA DE CLIENTES
    </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombres</TableCell>
            <TableCell>Apellidos</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell>Correo</TableCell>
            <TableCell>Comentarios</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.first_name}</TableCell>
              <TableCell>{client.last_name}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.comments}</TableCell>
              <TableCell>
                <IconButton color="primary" onClick={() => console.log('Editar', client)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(client.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
