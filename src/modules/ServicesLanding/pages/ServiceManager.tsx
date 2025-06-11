import React, { useState } from 'react';
import { Box, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { GridPaginationModel } from '@mui/x-data-grid';
import ServiceFormModal from '../../ServicesLanding/ServiceFormModal.tsx';
import ServiceTable from '../../ServicesLanding/ServiceTable.tsx';
import { ServiceData, useServices } from '../../ServicesLanding/hooks/useServices.ts';
import { TransitionProps } from '@mui/material/transitions';
import { ReactElement } from 'react';
import { containerStylesServices, titleStylesServices } from '../../ServicesLanding/Styles/ServiceLandingPage.styles.ts';


const Transition = React.forwardRef<HTMLDivElement, TransitionProps & { children: ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

export default function ServiceManager() {
  const { services, createOrUpdateService, deleteService } = useServices();

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<ServiceData, 'id'>>({
  nombre: '',
  precio: '',
  duracion: '',
  descripcion: '',
  imagen: '',
});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });
  const [snackbar, setSnackbar] = useState<{ 
  open: boolean; 
  message: string; 
  severity: 'success' | 'error' 
}>({ open: false, message: '', severity: 'success' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'imagen' && files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setFormData((prev) => ({ ...prev, imagen: reader.result as string }));
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async () => {
    try {
      await createOrUpdateService(formData, editingId || undefined);
      setSnackbar({ open: true, message: editingId ? '✅ Servicio actualizado.' : '✅ Servicio creado.', severity: 'success' });
      setFormOpen(false);
      setFormData({ nombre: '', precio: '', duracion: '', descripcion: '', imagen: '' });
      setEditingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
    setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleEdit = (service: ServiceData) => {
    setFormData({
      nombre: service.nombre,
      precio: service.precio,
      duracion: service.duracion,
      descripcion: service.descripcion,
      imagen: service.imagen,
    });
    setEditingId(service.id);
    setFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteService(confirmDeleteId);
      setSnackbar({ open: true, message: '✅ Servicio eliminado.', severity: 'success' });
      } catch (err) {
      const message = err instanceof Error ? err.message : '❌ Error al eliminar.';
      setSnackbar({ open: true, message, severity: 'error' });
      } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <Box sx={containerStylesServices}>
      <Typography variant="h4" sx={titleStylesServices}>
        SERVICIOS
      </Typography>
      <Button variant="contained" color="success" size="large" startIcon={<SaveIcon />} onClick={() => setFormOpen(true)}>
        AÑADIR
      </Button>

      <ServiceFormModal
        open={formOpen}
        formData={formData}
        onClose={() => setFormOpen(false)}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        editing={editingId !== null}
      />

      <ServiceTable
        services={services}
        onEdit={handleEdit}
        onDelete={setConfirmDeleteId}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
      />

      <Dialog open={confirmDeleteId !== null} TransitionComponent={Transition} keepMounted onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>¿Seguro que quieres eliminar este servicio?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción no se puede deshacer. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
          <Button color="error" onClick={handleConfirmDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
