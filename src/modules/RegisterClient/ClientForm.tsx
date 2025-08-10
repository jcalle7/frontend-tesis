import { Alert, Box, Button, Snackbar, TextField, Grid, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';
import { useState, useEffect } from 'react';
import _bcrypt from 'bcryptjs';
import { ClientFormData } from '../RegisterClient/TypesRegister.tsx';
import { formContainer, buttonGroup, buttonStyle } from "./Styles/ClientForm.styles.ts";
import { supabase } from "../../components/lib/supabaseClient.ts";
import { useNavigate } from 'react-router-dom';
import { InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import React from "react";

const COUNTRY_CODES = [
  { code: 'EC', name: 'Ecuador', dial: '+593' },
];

const flagEmoji = (iso: string) =>
  iso.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));

const toE164 = (dial: string, local: string) => {
  const digits = local.replace(/\D/g, '');
  const normalizedLocal = digits.replace(/^0+/, '');
  return `${dial}${normalizedLocal}`;
};

const isValidE164Digits = (digits: string) => {
  return digits.length >= 8 && digits.length <= 15;
};

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
  const [country, setCountry] = useState(COUNTRY_CODES.find(c => c.code === 'EC')!);
  const [localPhone, setLocalPhone] = useState(''); 
  const e164Preview = toE164(country.dial, localPhone);
  const e164Digits = e164Preview.replace(/\D/g, '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
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
      const { data } = await supabase
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

    const handleLocalPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    const onlyDigits = e.target.value.replace(/[^\d]/g, '');
    setLocalPhone(onlyDigits);
    const digitsTotal = toE164(country.dial, onlyDigits).replace(/\D/g, '');
    setPhoneError(isValidE164Digits(digitsTotal) ? null : 'Número inválido. Revisa longitud.');
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

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

  const phoneE164 = toE164(country.dial, localPhone);
  const digits = phoneE164.replace(/\D/g, '');
  if (!isValidE164Digits(digits)) {
    setPhoneError('Número inválido. Debe quedar en formato internacional, p. ej. +593999999999.');
    return;
  }

  try {
        //Obtener el token del usuario logueado
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setSnackbar({ open: true, message: '⚠️ Debes iniciar sesión para registrar un cliente.', severity: 'error' });
      return;
    }

    const response = await fetch('https://vmmwiyxfuchcehscnhef.supabase.co/functions/v1/register_client_with_auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        client: {
          first_name: formData.nombres,
          last_name: formData.apellidos,
          phone: phoneE164,
          email: formData.correo,
          comments: formData.comentarios || '',
          company_id: companyId,
        },
        password: formData.password
      })
    });

    const result = await response.json();

    if (!response.ok) {
      
      setSnackbar({ open: true, message: '❌ ' + (result?.error || 'Error desconocido'), severity: 'error' });
    } else {
      setSnackbar({ open: true, message: '✅ Cliente registrado correctamente', severity: 'success' });
      setFormData(initialForm);
    }
  } catch (error) {
    setSnackbar({ open: true, message: '❌ Error inesperado.', severity: 'error' });
    console.error(error);
  }
};

  return (
    <Box component="form" onSubmit={handleSubmit} sx={formContainer}>
      <TextField required label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} />
      <TextField required label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} />
      <Grid container spacing={2}>
        <Grid size={{xs: 12, sm: 4}}>
          <TextField
            select
            fullWidth
            label="País"
            value={country.code}
            onChange={(e) => {
              const next = COUNTRY_CODES.find(c => c.code === e.target.value)!;
              setCountry(next);
              // revalida con el nuevo código
              const digitsTotal = toE164(next.dial, localPhone).replace(/\D/g, '');
              setPhoneError(isValidE164Digits(digitsTotal) ? null : 'Número inválido. Revisa longitud.');
            }}
          >
            {COUNTRY_CODES.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {flagEmoji(c.code)} {c.name} ({c.dial})
              </MenuItem>
            ))}
          </TextField>

        </Grid>
        <Grid size={{xs: 12, sm: 8}}>
          <TextField
            required
            fullWidth
            label="Teléfono (solo números)"
            value={localPhone}
            onChange={handleLocalPhoneChange}
            placeholder="Ej: 0999999999"
            error={!!phoneError}
            helperText={phoneError ? phoneError : `Se guardará como ${e164Preview}`}
          />
        </Grid>
      </Grid>

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
