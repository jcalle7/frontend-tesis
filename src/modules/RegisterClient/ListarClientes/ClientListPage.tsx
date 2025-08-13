import {
  Box, IconButton, Snackbar, Alert, Tooltip,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useState } from 'react';
import { supabase } from '../../../components/lib/supabaseClient';
import { Client } from './TypesListClient.tsx';
import EditClientModal from './EditClientModal.tsx';
import React from 'react';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { useNavigate } from 'react-router-dom';
import { containerStylesList, titleStylesList } from "./Styles/ClientListPage.styles.ts";



const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ClientListPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchClients = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return;

    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.user.id)
      .single();

    if (!companyUser) return;

    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyUser.company_id);

    if (clientsData) {
      setClients(clientsData);
      setFilteredClients(clientsData);
    } else if (error) {
      setSnackbar({ open: true, message: 'Error al obtener clientes.', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);
    setFilteredClients(
      clients.filter(
        (c) =>
          c.first_name.toLowerCase().includes(value) ||
          c.last_name.toLowerCase().includes(value) ||
          (c.phone ?? '').toLowerCase().includes(value)
      )
    );
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      setSnackbar({ open: true, message: 'Error al eliminar cliente.', severity: 'error' });
    } else {
      setClients((prev) => prev.filter((c) => c.id !== id));
      setFilteredClients((prev) => prev.filter((c) => c.id !== id));
      setSnackbar({ open: true, message: 'Cliente eliminado.', severity: 'success' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await handleDelete(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const columns: GridColDef[] = [
    { field: 'first_name', headerName: 'Nombres', flex: 1 },
    { field: 'last_name', headerName: 'Apellidos', flex: 1 },
    { field: 'phone', headerName: 'Teléfono', flex: 1 },
    { field: 'email', headerName: 'Correo', flex: 1 },
    { field: 'comments', headerName: 'Comentarios', flex: 1 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.6,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <>
          <Tooltip title="Editar">
            <IconButton color="primary" onClick={() => handleEditClick(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton color="error" onClick={() => setConfirmDeleteId(params.row.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      )
    }
  ];

  

  return (
    <Box sx={ containerStylesList }>
      <Typography variant="h4" sx={titleStylesList}>
        LISTA DE CLIENTES
      </Typography>

      <TextField
        label="Buscar"
        variant="outlined"
        placeholder="Buscar por nombre o teléfono..."
        fullWidth
        value={searchQuery}
        onChange={handleSearch}
        sx={{ mb: 5 }}
        slotProps={{
        input: {
        endAdornment: (
        <InputAdornment position="end">
          <SearchIcon color="action" />
        </InputAdornment>
        ),
        },
        }}
      />



      <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={filteredClients}
        columns={columns}
        sx={{ mb: 9 }}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 20]} // ❗ Esto arregla también el warning de los 100
      />
      </Box>

      <Button
        variant="contained"
        color="secondary"
        size="large"
        sx={{ mb: 2 }}
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/register-client')}
      >
      Regresar
      </Button>

      {selectedClient && (
        <EditClientModal
          open={editModalOpen}
          handleClose={() => setEditModalOpen(false)}
          client={selectedClient}
          onSave={fetchClients}
        />
      )}

      <Dialog
        open={confirmDeleteId !== null}
        onClose={handleCancelDelete}
        slots={{ transition: Transition }}
        aria-describedby="confirm-delete-description"
        keepMounted
      >
        <DialogTitle>¿Seguro que quieres eliminar este cliente?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-description">
            Esta acción no se puede deshacer. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
