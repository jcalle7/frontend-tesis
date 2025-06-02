import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { supabase } from "../lib/supabaseClient.ts";
import { useNavigate } from 'react-router-dom';
import {
  containerStyles,
  alertStyles,
  buttonStyles,
  titleStyles,
  textFieldStyles,
} from '../auth/StylesLogin/loginStyles.ts';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleInputChange =
  (setter: (val: string) => void) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setter(e.target.value);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const role = data.user?.user_metadata?.role;

    switch (role) {
      case 'superadmin':
      case 'admin':
      default:
        navigate('/');
        break;
    }
  };

  return (
    <Box sx={containerStyles}>
      <Typography variant="h4" sx={titleStyles}>
        Iniciar sesión
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={alertStyles}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleLogin}>
        <TextField
          fullWidth
          label="Correo electrónico"
          placeholder="Ingresa tu correo electrónico"
          type="email"
          sx={textFieldStyles}
          value={email}
          onChange={handleInputChange(setEmail)}
        />

        <TextField
          fullWidth
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          type="password"
          sx={textFieldStyles}
          value={password}
          onChange={handleInputChange(setPassword)}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={buttonStyles}
        >
          Iniciar sesión
        </Button>
      </form>
    </Box>
  );
}
