import React from 'react';
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import {
  formContainerServices,
  buttonGroupServices,
  buttonStyleServices,
} from '../ServicesLanding/Styles/ServiceForm.styles.ts';

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

interface Props {
  open: boolean;
  formData: {
    nombre: string;
    precio: string;
    duracion: string;
    descripcion: string;
    imagen?: string;
  };
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  editing: boolean;
}

export default function ServiceFormModal({ open, formData, onClose, onChange, onSubmit, editing }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={formContainerServices}>
        <Typography variant="h6" mb={2}>{editing ? 'Editar Servicio' : 'Registrar Servicio'}</Typography>

        <TextField fullWidth label="Nombre del servicio" name="nombre" value={formData.nombre} onChange={onChange} margin="normal" />
        <TextField fullWidth label="Precio del servicio" name="precio" value={formData.precio} onChange={onChange} margin="normal" />
        <TextField fullWidth label="Duración del servicio" name="duracion" value={formData.duracion} onChange={onChange} margin="normal" />
        <TextField fullWidth label="Descripción" name="descripcion" value={formData.descripcion} onChange={onChange} multiline rows={2} margin="normal" />

        <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />} fullWidth sx={{ mt: 2 }}>
          Subir Imagen
          <input type="file" accept="image/*" hidden name="imagen" onChange={onChange} />
        </Button>

        {formData.imagen && (
          <Box mt={2} textAlign="center">
            <img src={formData.imagen} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
          </Box>
        )}

        <Box sx={ buttonGroupServices }>
          <Button variant="contained" color="success" onClick={onSubmit} sx={buttonStyleServices} >{editing ? 'Actualizar' : 'Guardar'}</Button>
          <Button variant="outlined" color="error" onClick={onClose} sx={buttonStyleServices} >Cancelar</Button>
        </Box>
      </Box>
    </Box>
    </Modal>
  );
}
