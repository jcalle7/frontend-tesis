import { Alert, Box, Button, Snackbar, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';
import { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { ClientFormData } from '../RegisterClient/TypesRegister.tsx';
import { formContainer, buttonGroup, buttonStyle } from "./Styles/ClientForm.styles.ts";
import { supabase } from "../../components/lib/supabaseClient.ts";
import { useNavigate } from 'react-router-dom';
import { InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import React from "react";

const initialForm: ClientFormData = {
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  password: '',
  confirmPassword: '',
  comentarios: '',
};

export default function ClientForm() {
  const [formData, setFormData] = useState<ClientFormData>(initialForm);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;
      const { data, error: _error } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.user.id)
        .single();
      if (data?.company_id) setCompanyId(data.company_id);
      else setSnackbar({ open: true, message: '⚠️ No se encontró la empresa asociada.', severity: 'error' });
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Validaciones de contraseña
    if (formData.password.length < 8) {
      setSnackbar({ open: true, message: '❌ La contraseña debe tener al menos 8 caracteres.', severity: 'error' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({ open: true, message: '❌ Las contraseñas no coinciden.', severity: 'error' });
      return;
    }

    if (!companyId) {
      setSnackbar({ open: true, message: '⚠️ No se pudo asociar cliente a una empresa.', severity: 'error' });
      return;
    }

    // 2) Hash de la contraseña
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(formData.password, salt);

    // 3) Inserción en Supabase
    const { error } = await supabase.from('clients').insert([{
      first_name: formData.nombres,
      last_name: formData.apellidos,
      phone: formData.telefono,
      email: formData.correo,
      comments: formData.comentarios || '',
      password_hash: passwordHash,
      company_id: companyId
    }]);

    if (error) {
      setSnackbar({ open: true, message: '❌ Error al guardar el cliente.', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: '✅ Cliente guardado con éxito', severity: 'success' });
      setFormData(initialForm);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={formContainer}>
      <TextField required label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} />
      <TextField required label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} />
      <TextField required label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
      <TextField required label="Correo" name="correo" value={formData.correo} onChange={handleChange} />
      <TextField
      required
      label="Contraseña"
      type={showPassword ? 'text' : 'password'}
      name="password"
      value={formData.password}
      onChange={handleChange}
      error={formData.password.length > 0 && formData.password.length < 8}
      helperText={
      formData.password.length > 0 && formData.password.length < 8
      ? 'Mínimo 8 caracteres'
      : ''
      }
      slotProps={{
        input: {
        endAdornment: (
        <InputAdornment position="end">
        <IconButton
          onClick={() => setShowPassword(!showPassword)}
          edge="end"
          size="small"
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
        </InputAdornment>
        ),
        }
        }}
        />
        <TextField
          required
          label="Confirmar Contraseña"
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={
            formData.confirmPassword.length > 0 &&
            formData.confirmPassword !== formData.password
          }
          helperText={
            formData.confirmPassword.length > 0 &&
            formData.confirmPassword !== formData.password
          ? 'Las contraseñas deben coincidir'
          : ''
          }
          slotProps={{
            input: {
          endAdornment: (
          <InputAdornment position="end">
          <IconButton
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          edge="end"
          size="small"
          >
          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
          </InputAdornment>
          ),
          }
          }}
      />
      <TextField
        multiline
        rows={3}
        label="Comentarios"
        name="comentarios"
        value={formData.comentarios}
        onChange={handleChange}
      />

      <Box sx={buttonGroup}>
        <Button
          type="submit"
          variant="contained"
          color="success"
          size="large"
          startIcon={<SaveIcon />}
          sx={buttonStyle}
        >
          GUARDAR
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ListIcon />}
          sx={buttonStyle}
          onClick={() => navigate('/clientes')}
        >
          LISTAR CLIENTES
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
