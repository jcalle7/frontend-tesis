import {
  Box, IconButton, Snackbar, Alert, Tooltip,
  TextField, Button,
  Typography, InputAdornment
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useState } from 'react';
import { supabase } from '../../components/lib/supabaseClient.ts';
import EditCompanyModal from '../CompanyRegister/modals/EditCompanyModal';
import DeleteCompanyModal from '../CompanyRegister/modals/DeleteCompanyModal';
import { useNavigate } from 'react-router-dom';
import { containerStylesCompanyList, titleStylesCompanyList } from '../CompanyRegister/Styles/CompanyListPage.styles.ts';
import { CompanyFormData } from './TypesCompany.ts';
type CompanyWithId = CompanyFormData & { id: string };

export default function CompanyListPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<CompanyWhithId[]>([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState<CompanyWhithId[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWhithId | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchEmpresas = async () => {
  
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase.from('companies').select('*');
    
    console.error('❌ Error al obtener empresas:', error);

      if (error) {
      setSnackbar({ open: true, message: 'Error al obtener empresas.', severity: 'error' });
    } else {
      setEmpresas((data ?? []) as CompanyWithId[]);
      setFilteredEmpresas((data ?? []) as CompanyWithId[]);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);
    setFilteredEmpresas(
      empresas.filter(
        (empresa) =>
          empresa.name.toLowerCase().includes(value) ||
          empresa.ruc.toLowerCase().includes(value)
      )
    );
  };

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Empresa', flex: 1 },
  { field: 'owner_name', headerName: 'Titular', flex: 1 },
  { field: 'ruc', headerName: 'RUC', flex: 1 },
  { field: 'phone', headerName: 'Teléfono', flex: 1 },
  { field: 'email', headerName: 'Correo', flex: 1 },
  { field: 'address', headerName: 'Dirección', flex: 1 },
  { field: 'slug', headerName: 'Slug', flex: 1 },
  {
    field: 'acciones',
    headerName: 'Acciones',
    flex: 1,
    renderCell: (params: GridRenderCellParams<CompanyWhithId>) => (
      <>
        <Tooltip title="Editar">
          <IconButton color="primary" onClick={() => { setSelectedCompany(params.row); setEditOpen(true); }}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton color="error" onClick={() => { setSelectedCompany(params.row); setDeleteOpen(true); }}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </>
    )
  }
];


  return (
    <Box sx={containerStylesCompanyList}>
      <Typography variant="h4" sx={titleStylesCompanyList}>
        EMPRESAS REGISTRADAS
      </Typography>

      <TextField
        label="Buscar"
        variant="outlined"
        placeholder="Buscar por nombre o RUC..."
        fullWidth
        value={searchQuery}
        onChange={handleSearch}
        sx={{ mb: 4 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={filteredEmpresas}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
        />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/register-company')}
        >
          REGRESAR
        </Button>
      </Box>

      {selectedCompany && (
        <EditCompanyModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          empresa={selectedCompany}
          onSave={fetchEmpresas}
        />
      )}

      {selectedCompany && (
        <DeleteCompanyModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          empresa={selectedCompany}
          onDelete={fetchEmpresas}
        />
      )}

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
