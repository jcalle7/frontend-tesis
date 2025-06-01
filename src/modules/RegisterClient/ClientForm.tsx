import { Box, Button, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';
import { useState } from 'react';
import { ClientFormData } from '../RegisterClient/TypesRegister.tsx';
import { formContainer, buttonGroup, buttonStyle } from "./Styles/ClientForm.styles.ts";
import React from "react";

const initialForm: ClientFormData = {
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  comentarios: '',
};

export default function ClientForm() {
  const [formData, setFormData] = useState<ClientFormData>(initialForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Datos enviados:', formData);
    
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={formContainer}
    >
      <TextField required label="Nombres" name="nombres" placeholder='Ingresa el nombre de un cliente' value={formData.nombres} onChange={handleChange} />
      <TextField required label="Apellidos" name="apellidos" placeholder='Ingresa el apellido de un cliente' value={formData.apellidos} onChange={handleChange} />
      <TextField required label="Teléfono" name="telefono" placeholder='Ingresa el número de teléfono de un cliente' value={formData.telefono} onChange={handleChange} />
      <TextField required label="Correo" name="correo" placeholder='Ingresa el correo de un cliente' value={formData.correo} onChange={handleChange} />
      <TextField multiline rows={3} label="Comentarios" name="comentarios" placeholder='Ingresa algún comentario sobre el cliente' value={formData.comentarios} onChange={handleChange} />

      <Box sx={buttonGroup}>
        <Button type="submit" variant="contained" color="success" startIcon={<SaveIcon />} sx={buttonStyle}>
          GUARDAR
        </Button>
        <Button variant="outlined" color="error" sx={buttonStyle}>
          CANCELAR
        </Button>
        <Button variant="contained" color="primary" startIcon={<ListIcon />} sx={buttonStyle}>
          LISTAR
        </Button>
      </Box>
    </Box>
  );
}
