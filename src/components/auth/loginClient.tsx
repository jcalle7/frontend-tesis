import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { MuiTelInput, matchIsValidTel } from 'mui-tel-input';
import { supabase } from '../../components/lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  containerStylesClient,
  alertStylesClient,
  buttonStylesClient,
  titleStylesClient,
  textFieldStylesClient,
} from './StylesLogin/loginClientStyles.ts';

// Normaliza a E.164 Ecuador (+593...)
function normalizeEcPhone(input?: string | null) {
  if (!input) return null;
  let p = input.replace(/[^\d+]/g, '');
  if (p.startsWith('+593')) return p;
  if (p.startsWith('0')) return '+593' + p.slice(1);
  if (/^\d{9,10}$/.test(p)) return '+593' + p.replace(/^0/, '');
  return p;
}

export default function LoginClient() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // SOLO registro
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneEc, setPhoneEc] = useState('+593'); // Ecuador E.164

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const slugParam = searchParams.get('slug') || '';
  const redirectParam = searchParams.get('redirect') || '';
  const decodedRedirect = redirectParam ? decodeURIComponent(redirectParam) : '';

  const handleInputChange =
    (setter: (val: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setter(e.target.value);

  // Helpers DENTRO del componente 👇
  async function getCompanyBySlug(slug: string) {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('companies')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();
    if (error) return null;
    return data;
  }

  async function ensureClientLinkedToSlug(
    currentEmail: string,
    slug: string,
    profile?: { first_name?: string; last_name?: string; phone?: string }
  ) {
    const company = await getCompanyBySlug(slug);
    if (!company?.id) return false;

    const phoneE164 = normalizeEcPhone(profile?.phone || null);

    const upsertPayload = {
      company_id: company.id,
      email: currentEmail,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      phone: phoneE164 || null,
    };

    // 1) intenta UPSERT por (company_id, email)
    const { data: upData, error: upErr } = await supabase
      .from('clients')
      .upsert(upsertPayload, { onConflict: 'company_id,email' })
      .select('id, first_name, last_name, phone')
      .maybeSingle();

    if (!upErr && upData) return true;

    // 2) fallback si no hay UNIQUE
    const { data: existing } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone')
      .eq('company_id', company.id)
      .eq('email', currentEmail)
      .maybeSingle();

    if (existing?.id) {
      const patch: any = {};
      if (profile?.first_name && !existing.first_name) patch.first_name = profile.first_name;
      if (profile?.last_name && !existing.last_name) patch.last_name = profile.last_name;
      if (phoneE164 && (!existing.phone || existing.phone !== phoneE164)) patch.phone = phoneE164;

      if (Object.keys(patch).length) {
        const { error: up2 } = await supabase.from('clients').update(patch).eq('id', existing.id);
        return !up2;
      }
      return true;
    }

    const { error: insErr } = await supabase.from('clients').insert(upsertPayload);
    return !insErr;
  }

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg('Correo o contraseña inválidos.');
        return;
      }

      const sessionResult = await supabase.auth.getSession();
      const userEmail = sessionResult.data.session?.user.email;
      if (!userEmail) {
        setErrorMsg('⚠️ No se pudo obtener la sesión del usuario.');
        return;
      }

      if (slugParam) {
        await ensureClientLinkedToSlug(userEmail, slugParam);
      }

      let targetSlug = slugParam;
      if (!targetSlug) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('company_id')
          .eq('email', userEmail)
          .limit(1)
          .maybeSingle();

        if (clientError || !client?.company_id) {
          setErrorMsg('No tienes acceso como cliente.');
          return;
        }

        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('slug')
          .eq('id', client.company_id)
          .maybeSingle();

        if (companyError || !company?.slug) {
          setErrorMsg('No se pudo redirigir a tu empresa.');
          return;
        }
        targetSlug = company.slug;
      }

      const finalPath = decodedRedirect || (targetSlug ? `/empresa/${targetSlug}` : '/');
      navigate(finalPath, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // REGISTRO
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      if (!slugParam) {
        setErrorMsg('Para registrarte, abre el enlace de la empresa (se necesita el slug).');
        return;
      }

      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Ingresa nombre y apellido.');
        return;
      }
      const telOk = matchIsValidTel(phoneEc) && phoneEc.startsWith('+593');
      if (!telOk) {
        setErrorMsg('Ingresa un teléfono válido de Ecuador (+593).');
        return;
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message || 'No se pudo crear la cuenta.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setInfoMsg('Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.');
        setMode('login');
        return;
      }

      await ensureClientLinkedToSlug(session.user.email, slugParam, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phoneEc,
      });

      navigate(`/empresa/${slugParam}`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={containerStylesClient}>
      <Typography variant="h4" sx={titleStylesClient}>
        Ingreso para Clientes
      </Typography>

      {(errorMsg || infoMsg) && (
        <Alert severity={errorMsg ? 'error' : 'info'} sx={alertStylesClient}>
          {errorMsg || infoMsg}
        </Alert>
      )}

      <Tabs
        value={mode}
        onChange={(_, v) => setMode(v)}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab value="login" label="Iniciar sesión" />
        <Tab value="register" label="Crear cuenta" />
      </Tabs>

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
        {mode === 'register' && (
          <>
            <TextField
              fullWidth
              label="Nombre"
              placeholder="Tu nombre"
              sx={textFieldStylesClient}
              value={firstName}
              onChange={handleInputChange(setFirstName)}
            />
            <TextField
              fullWidth
              label="Apellido"
              placeholder="Tu apellido"
              sx={textFieldStylesClient}
              value={lastName}
              onChange={handleInputChange(setLastName)}
            />
            <MuiTelInput
              defaultCountry="EC"
              onlyCountries={['EC']}
              forceCallingCode
              disableFormatting={false}
              label="Teléfono (WhatsApp)"
              value={phoneEc}
              onChange={setPhoneEc}
              sx={textFieldStylesClient}
            />
          </>
        )}

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
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </Button>
      </form>
    </Box>
  );
}
