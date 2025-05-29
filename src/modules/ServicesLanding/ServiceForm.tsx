import React, { useState } from 'react';
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel  } from '@mui/x-data-grid';
import SaveIcon from '@mui/icons-material/Save';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Slide from '@mui/material/Slide';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import { TransitionProps } from '@mui/material/transitions';


const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 900,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 3,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ServiceData {
  id: number;
  nombre: string;
  precio: string;
  duracion: string;
  imagen?: string;
}

export default function ServiceManager() {
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<ServiceData, 'id'>>({
    nombre: '',
    precio: '',
    duracion: '',
    imagen: '',
  });
  const [services, setServices] = useState<ServiceData[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);



  const handleOpen = () => {    
    setFormData({ nombre: '', precio: '', duracion: '', imagen: '' });
    setEditingId(null);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const closeImagePreview = () => setImagePreview(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'imagen' && files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setFormData({ ...formData, imagen: reader.result as string });
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = () => {
    if (editingId !== null) {
      setServices(services.map(s => s.id === editingId ? { ...s, ...formData } : s));
    } else {
      setServices([...services, { id: Date.now(), ...formData }]);
    }
    setFormData({ nombre: '', precio: '', duracion: '', imagen: '' });
    setEditingId(null);
    handleClose();
  };

  const handleEdit = (service: ServiceData) => {
    setFormData({ nombre: service.nombre, precio: service.precio, duracion: service.duracion, imagen: service.imagen });
    setEditingId(service.id);
    setOpen(true);
  };

  const handleRequestDelete = (id: number) => setConfirmDeleteId(id);

  const handleConfirmDelete = () => {
    if (confirmDeleteId !== null) {
      setServices(services.filter(s => s.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const handleCancelDelete = () => setConfirmDeleteId(null);

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'precio', headerName: 'Precio', flex: 1 },
    { field: 'duracion', headerName: 'Duración', flex: 1 },
    {
      field: 'imagen',
      headerName: 'Imagen',
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <img
            src={params.value}
            alt="preview"
            style={{ width: 40, height: 40, cursor: 'pointer', objectFit: 'cover', borderRadius: 4 }}
            onClick={() => setImagePreview(params.value)}
          />
        ) : (
          'Sin imagen'
        ),
    },
    {
      field: 'editar',
      headerName: 'Editar',
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => handleEdit(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    },
    {
      field: 'eliminar',
      headerName: 'Eliminar',
      renderCell: (params) => (
        <IconButton color="error" onClick={() => handleRequestDelete(params.row.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="contained" color="success" size="large" startIcon={<SaveIcon />} onClick={handleOpen}>
        AÑADIR
      </Button>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>Registrar Servicio</Typography>
          <TextField fullWidth label="Nombre del servicio" name="nombre" placeholder='Ingresa el nombre de un servicio' value={formData.nombre} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Precio del servicio" name="precio" placeholder='Ingresa el precio de un servicio' value={formData.precio} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Duración del servicio" name="duracion" placeholder='Ingresa la duración del servicio' value={formData.duracion} onChange={handleChange} margin="normal" />
          <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />} fullWidth sx={{ mt: 2 }}>
            Subir Imagen
            <input type="file" accept="image/*" hidden name="imagen" onChange={handleChange} />
          </Button>
          {formData.imagen && (
            <Box mt={2} textAlign="center">
              <img src={formData.imagen} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, mt: 3 }}>
            <Button variant="contained" color="success" onClick={handleSubmit}>{editingId ? 'Actualizar' : 'Guardar'}</Button>
            <Button variant="outlined" color="error" onClick={handleClose}>Cancelar</Button>
          </Box>
        </Box>
      </Modal>


      <Box mt={4} sx={{ width: '100%', maxWidth: '100%', minWidth: 1000, height: 300 }}>
      <DataGrid
        rows={services}
        columns={columns}
        getRowId={(row) => row.id}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        disableRowSelectionOnClick
      />
    </Box>

      <Dialog open={Boolean(imagePreview)} onClose={closeImagePreview} maxWidth="md">
        <DialogTitle>Vista previa de la imagen</DialogTitle>
        <DialogContent>
          {imagePreview && <img src={imagePreview} alt="Zoomed" style={{ width: '100%', height: 'auto' }} />}
        </DialogContent>
      </Dialog>

           <Dialog
        open={confirmDeleteId !== null}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCancelDelete}
        aria-describedby="confirm-delete-description"
      >
        <DialogTitle>¿Seguro que quieres eliminar este servicio?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-description">
            Esta acción no se puede deshacer. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancelar</Button>
          <Button color="error" onClick={handleConfirmDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
