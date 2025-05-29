import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { supabase } from '../../components/lib/supabaseClient';
import {
  formContainerCompany,
  sectionTitleCompany,
  buttonStyleCompany,
  TitlePrincipalCompany,
} from '../CompanyRegister/Styles/CompanyRegisterPage.styles';


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
    <Box component="form" onSubmit={handleSubmit} sx={formContainerCompany}>
      <Typography variant="h4" sx={TitlePrincipalCompany}>
        REGISTRAR EMPRESA
      </Typography>

      {successMsg && <Alert severity="success">{successMsg}</Alert>}
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <TextField label="Nombre" name="name" placeholder='Ingresa el nombre de un administrador' value={form.name} onChange={handleChange} />
        <TextField label="RUC" name="ruc" placeholder='Ingresa el número RUC de un administrador' value={form.ruc} onChange={handleChange} />
        <TextField label="Teléfono" name="phone" placeholder='Ingresa el número de teléfono de un administrador' value={form.phone} onChange={handleChange} />
        <TextField label="Email de la empresa" name="email" placeholder='Ingresa un email válido de un administrador' value={form.email} onChange={handleChange} />
        <TextField label="Dirección" name="address" placeholder='Ingresa la dirección del local del administrador' value={form.address} onChange={handleChange} />

        <Typography variant="h6" sx={sectionTitleCompany}>
          Usuario Administrador
        </Typography>

        <TextField label="Correo del admin" name="adminEmail" placeholder='Ingresa el email registrado anteriormente del administrador' value={form.adminEmail} onChange={handleChange} />
        <TextField label="Contraseña" name="adminPassword" placeholder='Ingresa una contraseña segura para el administrador' type="password" value={form.adminPassword} onChange={handleChange} />

        <Button type="submit" variant="contained" sx={buttonStyleCompany}>
          GUARDAR
        </Button>
    </Box>
  );
}
