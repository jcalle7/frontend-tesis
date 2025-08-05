import {
  Box, Typography, TextField, Button, Snackbar,
  Alert, Backdrop, CircularProgress
} from '@mui/material';
import { useState } from 'react';
import { formContainerCompany, sectionTitleCompany, buttonStyleCompany, TitlePrincipalCompany } from '../CompanyRegister/Styles/CompanyRegisterPage.ts';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CalloutAlert from '../../components/ui/CalloutAlert';

export default function CompanyRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    ruc: '',
    phone: '',
    email: '',
    address: '',
    adminEmail: '',
    adminPassword: '',
  });

  const [formError, setFormError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const isFormValid = () => {
    return Object.values(form).every((value) => value.trim() !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setFormError(true);
      return;
    } else {
      setFormError(false);
    }

    setLoading(true);

    const slug = generateSlug(form.name);

    const response = await fetch('https://vmmwiyxfuchcehscnhef.supabase.co/functions/v1/register_company_with_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: {
          name: form.name,
          owner_name: form.owner_name,
          ruc: form.ruc,
          phone: form.phone,
          email: form.email,
          address: form.address,
          slug: slug,
        },
        admin: {
          email: form.adminEmail,
          password: form.adminPassword,
        },
      }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setSnackbar({ open: true, message: '❌ ' + result.error, severity: 'error' });
      return;
    }

    setSnackbar({ open: true, message: '✅ Empresa y usuario creados correctamente', severity: 'success' });
    setForm({
      name: '', owner_name: '', ruc: '', phone: '', email: '', address: '',
      adminEmail: '', adminPassword: '',
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={formContainerCompany}>
      <Typography variant="h4" sx={TitlePrincipalCompany}>REGISTRAR EMPRESA</Typography>
      
      {formError && ( <CalloutAlert severity="error" title="Error al guardar" message={formError} /> )}
      <TextField label="Nombre de la empresa" name="name" value={form.name} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/> 
      <TextField label="Nombre del titular" name="owner_name" value={form.owner_name} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/>
      <TextField label="RUC" name="ruc" value={form.ruc} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/>
      <TextField label="Teléfono" name="phone" value={form.phone} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/>
      <TextField label="Correo de la empresa" name="email" value={form.email} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/>
      <TextField label="Dirección" name="address" value={form.address} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/>

      <Typography variant="h6" sx={sectionTitleCompany}>Usuario Administrador</Typography>

      <TextField label="Correo del admin" name="adminEmail" value={form.adminEmail} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/>
      <TextField type="password" label="Contraseña" name="adminPassword" value={form.adminPassword} onChange={handleChange} error={formError && form.name.trim() === ''} helperText={formError && form.name.trim() === '' ? 'Completa este campo' : ''}/>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" color="success" startIcon={<SaveIcon />} sx={buttonStyleCompany}>
          GUARDAR
        </Button>
        <Button variant="contained" color="primary" startIcon={<ListIcon />} onClick={() => navigate('/empresas')} sx={buttonStyleCompany}>
          LISTAR EMPRESAS
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
