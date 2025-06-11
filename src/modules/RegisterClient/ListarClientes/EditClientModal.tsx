import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack
} from '@mui/material';
import { useState, useEffect } from 'react';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import React from "react";
import { Client } from './TypesListClient.tsx'; 

type EditClientModalProps = {
  open: boolean;
  handleClose: () => void;
  client: Client;
  onSave: () => void;
};

export default function EditClientModal({
  open,
  handleClose,
  client,
  onSave
}: EditClientModalProps) {
  const [form, setForm] = useState<Client>(client);

  useEffect(() => {
    setForm(client); 
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('clients')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        email: form.email,
        comments: form.comments,
      })
      .eq('id', form.id);

    if (!error) {
      onSave(); // recarga clientes
      handleClose();
    } else {
      alert('Error al actualizar');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>Editar Cliente</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre" name="first_name" value={form.first_name} onChange={handleChange} fullWidth />
          <TextField label="Apellido" name="last_name" value={form.last_name} onChange={handleChange} fullWidth />
          <TextField label="Teléfono" name="phone" value={form.phone} onChange={handleChange} fullWidth />
          <TextField label="Correo" name="email" value={form.email} onChange={handleChange} fullWidth />
          <TextField label="Comentarios" name="comments" value={form.comments || ''} onChange={handleChange} fullWidth multiline />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error" variant="outlined" >Cancelar</Button>
        <Button onClick={handleUpdate} color="success" variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
