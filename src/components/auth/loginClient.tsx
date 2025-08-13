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

/* ======================
   Normaliza a E.164 Ecuador (+593...)
   ====================== */
function normalizeEcPhone(input?: string | null) {
  if (!input) return null;
  let p = input.replace(/[^\d+]/g, '');
  if (p.startsWith('+593')) return p;
  if (p.startsWith('0')) return '+593' + p.slice(1);
  if (/^\d{9,10}$/.test(p)) return '+593' + p.replace(/^0/, '');
  return p;
}

/* ======================
   HELPERS PARA NOMBRE Y UPSERT
   ====================== */
function splitName(full: string | null | undefined) {
  const s = (full ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return { first: '', last: '' };
  const parts = s.split(' ');
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts.slice(-1)[0] };
}

function nameFromEmail(email?: string | null) {
  if (!email) return { first: '', last: '' };
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return splitName(local);
}

/**
 * Vincula (o corrige) el cliente a una empresa por slug.
 * - Incluye SIEMPRE user_id.
 * - Usa UPSERT por (company_id, email).
 */
async function ensureClientLinkedToSlug(opts: {
  userId: string;
  currentEmail: string;
  slug: string;
  profile?: { first_name?: string; last_name?: string; phone?: string };
}) {
  const { userId, currentEmail, slug, profile } = opts;

  // Empresa
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!company?.id) return false;

  const phoneE164 = normalizeEcPhone(profile?.phone || null);

  // UPSERT por (company_id,email), estableciendo user_id también
  const { error: upErr } = await supabase
    .from('clients')
    .upsert(
      {
        company_id: company.id,
        email: currentEmail,
        user_id: userId, // clave
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        phone: phoneE164 ?? null,
      },
      { onConflict: 'company_id,email' }
    );

  if (upErr) return false;

  // Asegura user_id si existe fila vieja sin user_id
  await supabase
    .from('clients')
    .update({ user_id: userId })
    .eq('company_id', company.id)
    .eq('email', currentEmail)
    .is('user_id', null);

  return true;
}

/**
 * Normaliza/corrige nombres y teléfono del cliente
 * (nunca "App" y teléfono en E.164). También fija user_id.
 */
async function upsertClientForSignIn({
  slug,
  userId,
  email,
  fullName,
  phoneInput,
}: {
  slug: string;
  userId: string;
  email: string | null;
  fullName?: string | null;
  phoneInput?: string | null;
}) {
  // Empresa
  const { data: comp, error: compErr } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single();
  if (compErr || !comp?.id) throw new Error('No se encontró la empresa para el slug.');

  // Normalización
  const { first: fnFromForm, last: lnFromForm } = splitName(fullName ?? '');
  const { first: fnFromMail, last: lnFromMail } = nameFromEmail(email ?? '');
  const first_name = fnFromForm || fnFromMail || 'Cliente';
  const last_name = lnFromForm || lnFromMail || ''; // nunca "App"
  const phone = normalizeEcPhone(phoneInput || '') || null;

  // UPSERT por (company_id,email) con user_id
  const { error: upErr } = await supabase
    .from('clients')
    .upsert(
      {
        company_id: comp.id,
        email,
        user_id: userId,
        first_name,
        last_name,
        phone,
      },
      { onConflict: 'company_id,email' }
    );
  if (upErr) throw upErr;

  // Si hay fila del mismo email sin user_id, fíjalo
  await supabase
    .from('clients')
    .update({ user_id: userId })
    .eq('company_id', comp.id)
    .eq('email', email)
    .is('user_id', null);
}

/* ======================
   COMPONENTE
   ====================== */
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

  /* ======= LOGIN ======= */
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
      const userObj = sessionResult.data.session?.user;
      if (!userObj?.email) {
        setErrorMsg('⚠️ No se pudo obtener la sesión del usuario.');
        return;
      }

      // Si llega con slug, primero garantizamos vínculo y luego normalizamos
      if (slugParam) {
        await ensureClientLinkedToSlug({
          userId: userObj.id,
          currentEmail: userObj.email,
          slug: slugParam,
          profile: undefined,
        });

        await upsertClientForSignIn({
          slug: slugParam,
          userId: userObj.id,
          email: userObj.email,
          fullName: undefined,
          phoneInput: undefined,
        });
      }

      // Si no hay slug en la URL, busca a qué empresa pertenece por su email
      let targetSlug = slugParam;
      if (!targetSlug) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('company_id')
          .eq('email', userObj.email)
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

  /* ======= REGISTRO ======= */
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

      // Vincula (y pone user_id)…
      await ensureClientLinkedToSlug({
        userId: session.user.id,
        currentEmail: session.user.email,
        slug: slugParam,
        profile: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phoneEc,
        },
      });

      // …y normaliza/corrige los campos
      await upsertClientForSignIn({
        slug: slugParam,
        userId: session.user.id,
        email: session.user.email,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        phoneInput: phoneEc,
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
