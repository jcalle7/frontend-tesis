import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { supabase } from '../../components/lib/supabaseClient.ts';
import { useNavigate } from 'react-router-dom';
import {
  containerStylesClient,
  alertStylesClient,
  buttonStylesClient,
  titleStylesClient,
  textFieldStylesClient,
} from './StylesLogin/loginClientStyles.ts';

export default function LoginClient() {
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

    const { data: _data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("✅ Sesión iniciada:", _data);


    if (error) {
      setErrorMsg('Correo o contraseña inválidos.');
      return;
    }

    const sessionResult = await supabase.auth.getSession();
    const userEmail = sessionResult.data.session?.user.email;

    console.log("📧 Email autenticado:", userEmail);

    if (!userEmail) {
      setErrorMsg('⚠️ No se pudo obtener la sesión del usuario.');
    return;
    }

    // Verificar que el usuario exista como cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('company_id')
      .eq('email', userEmail)
      .limit(1)
      .maybeSingle();

      console.log("👤 CLIENT:", client);
      console.log("⚠️ ERROR CLIENT:", clientError);

    if (clientError || !client) {
      setErrorMsg('No tienes acceso como cliente.');
      return;
    }


    // Obtener el slug de la empresa para redirigir
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('slug')
      .eq('id', client.company_id)
      .single();

    if (companyError || !company?.slug) {
      setErrorMsg('No se pudo redirigir a tu empresa.');
      return;
    }

    navigate(`/empresa/${company.slug}`);
  };
  

  return (
    <Box sx={containerStylesClient}>
      <Typography variant="h4" sx={titleStylesClient}>
        Ingreso para Clientes
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={alertStylesClient}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleLogin}>
        <TextField
          fullWidth
          label="Correo electrónico"
          placeholder="Ingresa tu correo electrónico"
          type="email"
          sx={textFieldStylesClient}
          value={email}
          onChange={handleInputChange(setEmail)}
        />

        <TextField
          fullWidth
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          type="password"
          sx={textFieldStylesClient}
          value={password}
          onChange={handleInputChange(setPassword)}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={buttonStylesClient}
        >
          Iniciar sesión
        </Button>
      </form>
    </Box>
  );
}
