import React, { useEffect, useState } from 'react';
import {
  TextField, Button, Box, Typography, Alert, Card, CardContent, CardHeader,
  InputAdornment, IconButton, Link, FormControlLabel, Checkbox, CircularProgress
} from '@mui/material';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../components/lib/supabaseClient';

import {
  containerStyles,
  cardStyles,
  titleStyles,
  textFieldStyles,
  buttonStyles,
  footerRowStyles,
  subtitleStyles,
} from '../auth/StylesLogin/loginStyles.ts';

const BASE_URL =
  (import.meta as any).env?.VITE_PUBLIC_BASE_URL || window.location.origin;

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // prellenar correo si lo guardamos antes
  useEffect(() => {
    const last = localStorage.getItem('last_email');
    if (last) setEmail(last);
  }, []);

  const validate = () => {
    if (!email) return 'Ingresa tu correo.';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Correo inválido.';
    if (!password) return 'Ingresa tu contraseña.';
    return '';
    // (si usas passwordless, quita la validación de contraseña)
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const v = validate();
    if (v) { setErrorMsg(v); return; }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // 1) Verifica rol en user_metadata
      const role = (data.user?.user_metadata?.role as string) || '';
      if (!['admin', 'superadmin'].includes(role)) {
        // 2) (fallback) verifica que esté en company_users
        const { count, error: cuErr } = await supabase
          .from('company_users')
          .select('company_id', { count: 'exact', head: true })
          .eq('user_id', data.user.id);

        if (cuErr || !count || count < 1) {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta no tiene permisos de administrador.');
        }
      }

      if (remember) localStorage.setItem('last_email', email);
      else localStorage.removeItem('last_email');

      navigate('/'); // ajusta la ruta de tu dashboard si es distinta
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!email) {
      setErrorMsg('Escribe tu correo para enviarte el enlace de recuperación.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg('Correo inválido.');
      return;
    }
    try {
      setLoading(true);
      // Asegúrate de tener en tu app una ruta que capture el deep link de reset
      const redirectTo = `${BASE_URL}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setInfoMsg('Te enviamos un correo con el enlace para restablecer tu contraseña.');
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={containerStyles}>
      <Card elevation={6} sx={cardStyles}>
        <CardHeader
          title={<Typography sx={titleStyles}>Panel Administrativo</Typography>}
          subheader={<Typography sx={subtitleStyles}>Inicia sesión para continuar</Typography>}
        />
        <CardContent component="form" onSubmit={handleLogin}>
          {!!errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
          {!!infoMsg && <Alert severity="info" sx={{ mb: 2 }}>{infoMsg}</Alert>}

          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={textFieldStyles}
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Contraseña"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            sx={textFieldStyles}
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass(s => !s)} edge="end" aria-label="mostrar/ocultar contraseña">
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={footerRowStyles}>
            <FormControlLabel
              control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label="Recordarme"
            />
            <Link component="button" type="button" onClick={handleForgot}>
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={buttonStyles}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : undefined}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
