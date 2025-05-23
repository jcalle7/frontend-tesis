import React, { useEffect, useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from('clients')
      .select('*')
      .then((res) => console.log('🔗 Conexión Supabase OK:', res));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role === 'superadmin') {
      navigate('/');
    } else {
      navigate('/');
    }
  };

  return (
    <Box sx={{ width: 300, margin: 'auto', mt: 10 }}>
      <Typography variant="h5" mb={2}>Iniciar sesión</Typography>
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      <form onSubmit={handleLogin}>
        <TextField
          fullWidth
          label="Correo electrónico"
          type="email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          label="Contraseña"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }}>
          Iniciar sesión
        </Button>
      </form>
    </Box>
  );
}

