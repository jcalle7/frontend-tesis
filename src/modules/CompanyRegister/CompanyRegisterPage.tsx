import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { supabase } from '../../components/lib/supabaseClient';

export default function CompanyRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    ruc: '',
    phone: '',
    email: '',
    address: '',
    adminEmail: '',
    adminPassword: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // 1. Insertar empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([{
        name: form.name,
        ruc: form.ruc,
        phone: form.phone,
        email: form.email,
        address: form.address,
      }])
      .select()
      .single();

    if (companyError) {
      setErrorMsg('❌ Error al crear la empresa: ' + companyError.message);
      return;
    }

    // 2. Crear usuario admin y asociarlo a esa empresa
    const { error: userError } = await supabase.auth.admin.createUser({
      email: form.adminEmail,
      password: form.adminPassword,
      user_metadata: {
        role: 'admin',
        company_id: company.id,
      },
    });

    if (userError) {
      setErrorMsg('❌ Error al crear el usuario: ' + userError.message);
      return;
    }

    setSuccessMsg('✅ Empresa y usuario creados correctamente');
    setForm({
      name: '', ruc: '', phone: '', email: '', address: '',
      adminEmail: '', adminPassword: '',
    });
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom>Registrar Empresa</Typography>

      {successMsg && <Alert severity="success">{successMsg}</Alert>}
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField fullWidth label="Nombre" name="name" value={form.name} onChange={handleChange} margin="normal" />
        <TextField fullWidth label="RUC" name="ruc" value={form.ruc} onChange={handleChange} margin="normal" />
        <TextField fullWidth label="Teléfono" name="phone" value={form.phone} onChange={handleChange} margin="normal" />
        <TextField fullWidth label="Email de la empresa" name="email" value={form.email} onChange={handleChange} margin="normal" />
        <TextField fullWidth label="Dirección" name="address" value={form.address} onChange={handleChange} margin="normal" />

        <Typography variant="h6" sx={{ mt: 3 }}>Usuario Administrador</Typography>
        <TextField fullWidth label="Correo del admin" name="adminEmail" value={form.adminEmail} onChange={handleChange} margin="normal" />
        <TextField fullWidth label="Contraseña" name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} margin="normal" />

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Guardar</Button>
      </form>
    </Box>
  );
}
