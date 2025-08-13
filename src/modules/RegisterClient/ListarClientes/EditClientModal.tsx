import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack
} from '@mui/material';
import { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../components/lib/supabaseClient';
import React from "react";
import { InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  useEffect(() => {
    setForm(client); 
    setNewPassword('');
    setConfirmNewPassword('');
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const updatePayload: Partial<Client> = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email,
      comments: form.comments,
    };
      
      if (newPassword || confirmNewPassword) {
        if (newPassword.length < 8) {
          alert('La nueva contraseña debe tener al menos 8 caracteres.');
          return;
      }
      if (newPassword !== confirmNewPassword) {
        alert('Las nuevas contraseñas no coinciden.');
        return;
      }
      const salt = bcrypt.genSaltSync(10);
      updatePayload.password_hash = bcrypt.hashSync(newPassword, salt);
    }

    const { error:updateError } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', form.id);

    if (updateError) {
      console.error(updateError);
      alert('❌ Error al actualizar el cliente.');
    } else {
      onSave();
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>Editar Cliente</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre" name="first_name" value={form.first_name ?? ''} onChange={handleChange} fullWidth />
          <TextField label="Apellido" name="last_name" value={form.last_name ?? ''} onChange={handleChange} fullWidth />
          <TextField label="Teléfono" name="phone" value={form.phone ?? ''} onChange={handleChange} fullWidth />
          <TextField label="Correo" name="email" value={form.email ?? ''} onChange={handleChange} fullWidth />
          <TextField label="Comentarios" name="comments" value={form.comments || ''} onChange={handleChange} fullWidth multiline />
          <TextField
            label="Nueva Contraseña"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            fullWidth
            error={newPassword.length > 0 && newPassword.length < 8}
            helperText={
            newPassword.length > 0 && newPassword.length < 8
            ? 'Mínimo 8 caracteres'
            : 'Deja vacío para no cambiar'
          }
            slotProps={{
              input: {
            endAdornment: (
            <InputAdornment position="end">
            <IconButton
            onClick={() => setShowNewPassword(!showNewPassword)}
            edge="end"
            size="small"
          >
          {showNewPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
          </InputAdornment>
          ),
          }
          }}
          />
          <TextField
          label="Confirmar Contraseña"
          type={showConfirmNewPassword ? 'text' : 'password'}
          value={confirmNewPassword}
          onChange={e => setConfirmNewPassword(e.target.value)}
          fullWidth
          error={
            confirmNewPassword.length > 0 &&
            confirmNewPassword !== newPassword
          }
          helperText={
          confirmNewPassword.length > 0 &&
          confirmNewPassword !== newPassword
          ? 'Debe coincidir con la nueva contraseña'
          : 'Repite la nueva contraseña'
          }
          slotProps={{
          input: {
          endAdornment: (
          <InputAdornment position="end">
          <IconButton
          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
          edge="end"
          size="small"
          >
          {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
          </InputAdornment>
          ), 
          }
          }}
        />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error" variant="outlined" >Cancelar</Button>
        <Button onClick={handleUpdate} color="success" variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
