import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Snackbar, Alert
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { CompanyFormData } from '../TypesCompany.ts';
import { supabase } from '../../../components/lib/supabaseClient';

type Props = {
  open: boolean;
  onClose: () => void;
  empresa: CompanyFormData & { id: string } | null;
  onSave: () => void;
};

export default function EditCompanyModal({ open, onClose, empresa, onSave }: Props) {
  const [form, setForm] = useState<CompanyFormData & { adminPassword?: string }>({
    name: '',
    owner_name: '',
    ruc: '',
    phone: '',
    email: '',
    address: '',
    slug: '',
    adminPassword: '',
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (empresa) setForm({ ...empresa, adminPassword: '' });
  }, [empresa]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!empresa?.id) return;

    const newSlug = form.name.toLowerCase().trim().replace(/\s+/g, '-');

    const { error: companyError } = await supabase
      .from('companies')
      .update({
        name: form.name,
        owner_name: form.owner_name,
        ruc: form.ruc,
        phone: form.phone,
        email: form.email,
        address: form.address,
        slug: newSlug,
      })
      .eq('id', empresa.id);

    if (companyError) {
      setSnackbar({ open: true, message: '❌ Error al actualizar: ' + companyError.message, severity: 'error' });
      return;
    }

    if (form.adminPassword?.trim()) {
      const response = await fetch('https://vmmwiyxfuchcehscnhef.supabase.co/functions/v1/update_admin_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: empresa.id,
          new_password: form.adminPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setSnackbar({ open: true, message: '❌ Error al cambiar la contraseña: ' + result.error, severity: 'error' });
        return;
      }
    }

    setSnackbar({ open: true, message: '✅ Empresa actualizada correctamente', severity: 'success' });
    onSave();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle>Editar Empresa</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" name="name" label="Nombre" value={form.name} onChange={handleChange} />
          <TextField fullWidth margin="dense" name="owner_name" label="Titular" value={form.owner_name} onChange={handleChange} />
          <TextField fullWidth margin="dense" name="ruc" label="RUC" value={form.ruc} onChange={handleChange} />
          <TextField fullWidth margin="dense" name="phone" label="Teléfono" value={form.phone} onChange={handleChange} />
          <TextField fullWidth margin="dense" name="email" label="Email" value={form.email} onChange={handleChange} />
          <TextField fullWidth margin="dense" name="address" label="Dirección" value={form.address} onChange={handleChange} />
          <TextField fullWidth margin="dense" name="adminPassword" label="Nueva contraseña del admin" type="password" value={form.adminPassword || ''} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
