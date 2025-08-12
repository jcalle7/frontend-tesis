import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button,
  Badge, Avatar, Menu, MenuItem, IconButton
} from '@mui/material';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient';

type NavbarProps = {
  userName?: string; // opcional, ya no dependemos de esto
  companyName?: string;
  carrito: Array<any>;
  onCartClick?: () => void;
  setShowCart?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Navbar: React.FC<NavbarProps> = ({
  userName,
  companyName = 'Empresa',
  carrito = [],
  onCartClick,
  setShowCart
}) => {
  const navigate = useNavigate();

  // ---------- Sesión real de Supabase ----------
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session ?? null);
    };
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!alive) return;
      setSession(s ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---------- Nombre/Iniciales ----------
  const displayName = useMemo(() => {
    // si viene desde el padre y hay sesión, lo usamos como preferencia
    const u = session?.user;
    const meta = u?.user_metadata || {};
    const bestFromAuth = [meta.full_name || meta.name, [meta.given_name, meta.family_name].filter(Boolean).join(' ')]
      .filter(Boolean)[0] || (u?.email ? u.email.split('@')[0] : '');

    // evitar mostrar "Cliente Landing"
    const cleaned = (userName || bestFromAuth || '')
      .replace(/cliente\s*landing/ig, '')
      .trim();

    return cleaned;
  }, [session, userName]);

  const initials =
    (displayName || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]!.toUpperCase())
      .join('') || 'U';

  // ---------- Handlers ----------
  const handleCart = () => {
    if (onCartClick) return onCartClick();
    if (setShowCart) return setShowCart(prev => !prev);
  };

const handleLogout = async () => {
  setAnchorEl(null);

  const LOGIN_URL = '/login-cliente';

  // 1) intenta cerrar sesión pero no esperes más de 150ms
  const signOutP = supabase.auth.signOut({ scope: 'global' }).catch(() => {});
  const timeoutP = new Promise((r) => setTimeout(r, 150));
  await Promise.race([signOutP, timeoutP]);

  // 2) limpia storage local (por si acaso)
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') || k.includes('supabase')) localStorage.removeItem(k);
    });
    sessionStorage.clear();
  } catch {}

  // 3) redirección dura (siempre navega)
  window.location.replace(LOGIN_URL);
};

  // ---------- UI ----------
  return (
    <AppBar
      position="sticky"
      elevation={6}
      sx={{
        background: 'linear-gradient(90deg,#eef2ff,#f5f3ff)',
        color: '#0f172a',
        backdropFilter: 'saturate(1.1) blur(6px)'
      }}
    >
      <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: '.3px', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title={companyName}
          >
            {companyName}
          </Typography>
        </Box>

        {/* Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1.5 } }}>
          <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => {
            document.querySelector('#servicios')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Servicios
          </Button>

          <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => {
            document.querySelector('#contacto')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Contacto
          </Button>

          <Button
            color="inherit"
            startIcon={
              <Badge
                badgeContent={carrito?.length || 0}
                sx={{ '& .MuiBadge-badge': { backgroundColor: '#6d28d9', color: '#fff' } }}
              >
                <ShoppingCart />
              </Badge>
            }
            onClick={handleCart}
            sx={{ fontWeight: 700, letterSpacing: '.02em' }}
          >
            Carrito
          </Button>

          {/* Si NO hay sesión: botón de login */}
          {!session && (
            <Button
              variant="contained"
              onClick={() => navigate('/login-cliente')}
              sx={{ ml: 1, fontWeight: 800, borderRadius: 999 }}
            >
              Iniciar sesión
            </Button>
          )}

          {/* Si hay sesión: avatar + menú */}
          {session && (
            <>
              <Avatar
                sx={{ bgcolor: '#e11d48', width: 40, height: 40, fontWeight: 800, ml: 1, cursor: 'pointer' }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                title={displayName || 'Usuario'}
              >
                {initials}
              </Avatar>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                // Nota: los warnings aria-hidden de MUI no afectan funcionalidad
              >
                <MenuItem onClick={async () => { await handleLogout(); }}>
                  Cerrar sesión
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
