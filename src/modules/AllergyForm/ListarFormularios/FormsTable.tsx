import React, { useEffect, useState } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowParams, GridPaginationModel } from '@mui/x-data-grid';
import {
  Box, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Button, Slide
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../../components/lib/supabaseClient";
import { TransitionProps } from '@mui/material/transitions';
import FormsEdit from "../ListarFormularios/FormsEdit.tsx";

type FormRow = { id: string; title: string };

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface FormsTableProps {
  refresh?: boolean;
}

export default function FormsTable({ refresh }: FormsTableProps) {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 5,
    page: 0,
  });
  const navigate = useNavigate();

  const fetchForms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('custom_forms').select('id, title');
    setLoading(false);
    if (error) setSnackbar({ open: true, message: error.message, severity: 'error' });
    else setForms((data ?? []) as FormRow[]);
  };

  useEffect(() => { fetchForms(); }, [refresh]);

  const handleDeleteClick = (id: string) => setConfirmDeleteId(id);
  const handleCancelDelete = () => setConfirmDeleteId(null);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await supabase.from('custom_form_questions').delete().eq('form_id', confirmDeleteId);
    const { error } = await supabase.from('custom_forms').delete().eq('id', confirmDeleteId);
    if (error) setSnackbar({ open: true, message: error.message, severity: 'error' });
    else {
      setSnackbar({ open: true, message: 'Formulario eliminado.', severity: 'success' });
      fetchForms();
    }
    setConfirmDeleteId(null);
  };

  const columns: GridColDef<FormRow>[] = [
    { field: 'title', headerName: 'Título', flex: 1 },
    {
      field: 'actions',
      headerName: 'Acciones',
      type: 'actions',
      getActions: (params: GridRowParams<FormRow>) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          onClick={() => setEditId(params.id as string)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => handleDeleteClick(params.id as string)}
        />,
        <GridActionsCellItem
          key="preview"
          icon={<PreviewIcon />}
          label="Vista Previa"
          onClick={() => navigate(`/formularios/vista-previa/${params.id}`)}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={forms}
        columns={columns}
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10]}
        loading={loading}
        disableRowSelectionOnClick
        sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 1 }}
        autoHeight
      />
      {/* Modal de edición */}
      {editId && (
        <FormsEdit
          open={!!editId}
          formId={editId}
          onClose={() => setEditId(null)}
          onAfterSave={() => {
            setEditId(null);
            fetchForms();
          }}
        />
      )}
      <Dialog
        open={!!confirmDeleteId}
        onClose={handleCancelDelete}
        TransitionComponent={Transition}
        aria-describedby="confirm-delete-description"
        keepMounted
      >
        <DialogTitle>¿Seguro que quieres eliminar este formulario?</DialogTitle>
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
