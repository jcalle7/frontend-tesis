import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button,
  Badge, Avatar, Menu, MenuItem, IconButton,
  Drawer, Divider, List, ListItemButton, ListItemText, ListItemIcon
} from '@mui/material';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import Home from '@mui/icons-material/Home';
import ContactPage from '@mui/icons-material/ContactPage';
import Logout from '@mui/icons-material/Logout';
import Login from '@mui/icons-material/Login';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient';

type NavbarProps = {
  userName?: string;
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

  const [session, setSession] =
    useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (alive) setSession(data.session ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (alive) setSession(s ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const displayName = useMemo(() => {
    const u = session?.user;
    const meta = u?.user_metadata || {};
    const bestFromAuth = [meta.full_name || meta.name, [meta.given_name, meta.family_name].filter(Boolean).join(' ')]
      .filter(Boolean)[0] || (u?.email ? u.email.split('@')[0] : '');
    return (userName || bestFromAuth || '').replace(/cliente\s*landing/ig, '').trim();
  }, [session, userName]);

  const initials = (displayName || '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]!.toUpperCase()).join('') || 'U';

  const handleCart = () => {
    if (onCartClick) return onCartClick();
    if (setShowCart) return setShowCart(prev => !prev);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    const LOGIN_URL = '/login-cliente';
    const signOutP = supabase.auth.signOut({ scope: 'global' }).catch(() => {});
    const timeoutP = new Promise((r) => setTimeout(r, 150));
    await Promise.race([signOutP, timeoutP]);
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('sb-') || k.includes('supabase')) localStorage.removeItem(k);
      });
      sessionStorage.clear();
    } catch {}
    window.location.replace(LOGIN_URL);
  };

  const closeMobile = () => setMobileOpen(false);

  const MobileMenu = (
    <Box role="presentation" sx={{ width: 280 }}>
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, noWrap: true }}>{companyName}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton aria-label="Cerrar" onClick={() => setMobileOpen(false)}>
          <MenuIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        <ListItemButton onClick={() => { closeMobile(); document.querySelector('#servicios')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <ListItemIcon><Home /></ListItemIcon>
          <ListItemText primary="Servicios" />
        </ListItemButton>

        <ListItemButton onClick={() => { closeMobile(); document.querySelector('#contacto')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <ListItemIcon><ContactPage /></ListItemIcon>
          <ListItemText primary="Contacto" />
        </ListItemButton>

        <ListItemButton onClick={() => { closeMobile(); handleCart(); }}>
          <ListItemIcon>
            <Badge badgeContent={carrito?.length || 0} sx={{ '& .MuiBadge-badge': { backgroundColor: '#6d28d9', color: '#fff' } }}>
              <ShoppingCart />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Carrito" />
        </ListItemButton>
      </List>

      <Divider />

      {!session ? (
        <List>
          <ListItemButton onClick={() => { closeMobile(); navigate('/login-cliente'); }}>
            <ListItemIcon><Login /></ListItemIcon>
            <ListItemText primary="Iniciar sesión" />
          </ListItemButton>
        </List>
      ) : (
        <List>
          <ListItemButton onClick={() => { closeMobile(); handleLogout(); }}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </List>
      )}
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={6}
      sx={{ background: 'linear-gradient(90deg,#eef2ff,#f5f3ff)', color: '#0f172a', backdropFilter: 'saturate(1.1) blur(6px)' }}
    >
      <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', gap: 1 }}>
        {/* Izquierda: hamburguesa (solo móvil) + marca */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            sx={{ fontWeight: 800, letterSpacing: '.3px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title={companyName}
          >
            {companyName}
          </Typography>
        </Box>

        {/* Links de navegación — SOLO DESKTOP */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
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
              <Badge badgeContent={carrito?.length || 0} sx={{ '& .MuiBadge-badge': { backgroundColor: '#6d28d9', color: '#fff' } }}>
                <ShoppingCart />
              </Badge>
            }
            onClick={handleCart}
            sx={{ fontWeight: 700, letterSpacing: '.02em' }}
          >
            Carrito
          </Button>
        </Box>

        {/* Acciones derechas */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Carrito SOLO móvil */}
          <IconButton color="inherit" onClick={handleCart} sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label="Abrir carrito">
            <Badge badgeContent={carrito?.length || 0} sx={{ '& .MuiBadge-badge': { backgroundColor: '#6d28d9', color: '#fff' } }}>
              <ShoppingCart />
            </Badge>
          </IconButton>

          {/* Login SOLO desktop si no hay sesión */}
          {!session && (
            <Button
              variant="contained"
              onClick={() => navigate('/login-cliente')}
              sx={{ ml: 0.5, fontWeight: 800, borderRadius: 999, display: { xs: 'none', md: 'inline-flex' } }}
              startIcon={<Login />}
            >
              Iniciar sesión
            </Button>
          )}

          {/* Avatar + menú SOLO desktop si hay sesión */}
          {session && (
            <>
              <Avatar
                sx={{ bgcolor: '#e11d48', width: 40, height: 40, fontWeight: 800, ml: 0.5, cursor: 'pointer', display: { xs: 'none', md: 'inline-flex' } }}
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
              >
                <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>

      {/* Drawer móvil */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { borderTopRightRadius: 12, borderBottomRightRadius: 12 } }}
      >
        {MobileMenu}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
