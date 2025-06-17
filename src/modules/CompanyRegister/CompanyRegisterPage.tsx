import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Snackbar, Alert, Backdrop, CircularProgress,
} from '@mui/material';
import {
  formContainerCompany,
  sectionTitleCompany,
  buttonStyleCompany,
  TitlePrincipalCompany,
} from "./Styles/CompanyRegisterPage.styles.ts";
import React from "react";

export default function CompanyRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    Ownername: '',
    ruc: '',
    phone: '',
    email: '',
    address: '',
    adminEmail: '',
    adminPassword: '',
  });

  const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // quitar símbolos
    .replace(/\s+/g, '-')     // espacios a guiones
    .replace(/-+/g, '-');     // quitar guiones duplicados

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormValid = () => {
    return Object.values(form).every((value) => value.trim() !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setSnackbar({ open: true, message: '⚠️ Todos los campos son obligatorios.', severity: 'error' });
      return;
    }

    setLoading(true);

    const slug = generateSlug(form.name); // genera el slug

    const response = await fetch('https://vmmwiyxfuchcehscnhef.supabase.co/functions/v1/register_company_with_admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: Se Puede enviar un token aquí si luego se quiere seguridad extra
        // 'x-admin-token': 'TOKEN_INTERNO_SECRETO'
      },
      body: JSON.stringify({
        company: {
          name: form.name,
          Ownername: form.Ownername,
          ruc: form.ruc,
          phone: form.phone,
          email: form.email,
          address: form.address,
          slug: slug, // usa el slug generado

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
      name: '', Ownername: '', ruc: '', phone: '', email: '', address: '',
      adminEmail: '', adminPassword: '',
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={formContainerCompany}>
      <Typography variant="h4" sx={TitlePrincipalCompany}>
        REGISTRAR EMPRESA
      </Typography>

      <TextField label="Nombre de la empresa" name="name" value={form.name} onChange={handleChange} />
      <TextField label="Nombre del titular" name="Ownername" value={form.Ownername} onChange={handleChange} />
      <TextField label="RUC" name="ruc" value={form.ruc} onChange={handleChange} />
      <TextField label="Teléfono" name="phone" value={form.phone} onChange={handleChange} />
      <TextField label="Email de la empresa" name="email" value={form.email} onChange={handleChange} />
      <TextField label="Dirección" name="address" value={form.address} onChange={handleChange} />

      <Typography variant="h6" sx={sectionTitleCompany}>
        Usuario Administrador
      </Typography>

      <TextField label="Correo del admin" name="adminEmail" value={form.adminEmail} onChange={handleChange} />
      <TextField label="Contraseña" name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} />

      <Button type="submit" variant="contained" sx={buttonStyleCompany}>
        GUARDAR
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
