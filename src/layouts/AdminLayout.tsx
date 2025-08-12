import { useState, useEffect, useMemo } from 'react';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  Tooltip, Avatar, Menu, MenuItem, Divider, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Button, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { supabase } from "../components/lib/supabaseClient";
import MenuIcon from '@mui/icons-material/Menu';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import HealingIcon from '@mui/icons-material/Healing';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidthExpanded = 230;
const drawerWidthCollapsed = 70;
const drawerWidthMobile = 280;

const navItems = [
  { text: 'Inicio', icon: <HomeOutlined />, path: '/inicio' },
  { text: 'Registrar Cliente', icon: <PersonAddIcon />, path: '/register-client' },
  { text: 'Historial Cliente', icon: <HistoryIcon />, path: '/history-client' },
  { text: 'Servicios', icon: <BuildIcon />, path: '/services' },
  { text: 'Formularios', icon: <HealingIcon />, path: '/allergy' },
  { text: 'Agendar cita', icon: <CalendarMonthIcon />, path: '/agendar' },
  { text: 'Ver cita', icon: <EventNoteIcon />, path: '/ver-cita' },
  { text: 'Registrar Empresa', icon: <BusinessIcon />, path: '/register-company', role: 'superadmin' },
];

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}
const clean = (s: string) => s.trim().replace(/\s+/g, ' ');
function twoInitials(name: string) {
  const parts = clean(name).split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function pickNameOrEmail(userName?: string, email?: string) {
  if (userName && userName.trim()) return clean(userName);
  if (email) return email.split('@')[0];
  return 'Usuario';
}

export default function AdminLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [collapsed, setCollapsed] = useState(false);   // solo desktop
  const [mobileOpen, setMobileOpen] = useState(false); // solo móvil

  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  // menú avatar
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // cargar datos de usuario / empresa
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role as string | undefined;
      setUserRole(role ?? null);

      if (!user) return;

      const first = user.user_metadata?.first_name as string | undefined;
      const last = user.user_metadata?.last_name as string | undefined;
      const full = user.user_metadata?.name as string | undefined;
      setUserName(full || [first, last].filter(Boolean).join(' ') || '');
      setUserEmail(user.email || '');

      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyUser?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyUser.company_id)
          .maybeSingle();
        setCompanyName(company?.name ?? null);
      } else if (role === 'superadmin') {
        setCompanyName(null);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const filteredNavItems = (() => {
    if (userRole === 'superadmin') {
      return [
        { text: 'Inicio', icon: <EventNoteIcon />, path: '/' },
        { text: 'Registrar Empresa', icon: <BusinessIcon />, path: '/register-company' },
      ];
    }
    return navItems.filter((item) => !item.role || item.role === userRole);
  })();

  const titleText =
    companyName
      ? `${companyName} - Panel Administrativo`
      : userRole === 'superadmin'
        ? 'Superadmin - Panel Administrativo'
        : 'Panel Administrativo';

  const baseName = pickNameOrEmail(userName, userEmail);
  const initials = useMemo(() => twoInitials(baseName), [baseName]);
  const avatarColor = useMemo(() => stringToColor(baseName), [baseName]);
  const saludoNombre = useMemo(() => clean(baseName).split(' ')[0], [baseName]);

  // contenido del menú (lo reutilizamos en desktop y móvil)
  const NavList = (
    <List>
      {filteredNavItems.map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false); // cerrar drawer en móvil al navegar
              }}
              selected={isActive}
              sx={{
                ...(isActive && {
                  backgroundColor: 'action.selected',
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                    color: 'primary.main',
                    fontWeight: 'bold',
                  },
                }),
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {/* En desktop colapsado ocultamos el texto; en móvil siempre mostramos */}
              {(!isDesktop || !collapsed) && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* TOPBAR */}
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => (isDesktop ? setCollapsed((v) => !v) : setMobileOpen(true))}
            sx={{ mr: 2 }}
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              pr: isDesktop ? (collapsed ? 7 : 0) : 0, // compensa íconos a la derecha
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={titleText}
          >
            {titleText}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, letterSpacing: 0.2 }}
            >
              Hola, {saludoNombre}
            </Typography>

            <Tooltip title={userName || userEmail || 'Cuenta'}>
              <IconButton
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                size="small"
                aria-controls={menuOpen ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
              >
                <Avatar
                  sx={{ width: 40, height: 40, bgcolor: avatarColor, color: '#fff', fontWeight: 700 }}
                >
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={menuAnchor}
            id="account-menu"
            open={menuOpen}
            onClose={() => setMenuAnchor(null)}
            onClick={() => setMenuAnchor(null)}
            PaperProps={{ elevation: 4, sx: { mt: 1.5, minWidth: 220 } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Avatar sx={{ width: 28, height: 28, mr: 1 }}>{initials}</Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>{userName || 'Usuario'}</Typography>
                <Typography variant="caption" color="text.secondary">{userEmail}</Typography>
              </Box>
            </MenuItem>

            <Divider />
            <MenuItem onClick={() => setConfirmLogout(true)} sx={{ color: 'error.main', fontWeight: 600 }}>
              <ListItemIcon><LogoutRounded color="error" fontSize="small" /></ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR — Desktop (permanent y colapsable) */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          open={!collapsed}
          sx={{
            width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
              transition: 'width 0.3s',
              overflowX: 'hidden',
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar variant="dense" />
          {NavList}
        </Drawer>
      )}

      {/* SIDEBAR — Móvil (temporary, overlay) */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: drawerWidthMobile } }}
        >
          <Toolbar variant="dense" />
          {NavList}
        </Drawer>
      )}

      {/* CONTENIDO */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        <Toolbar variant="dense" />
        <Outlet />
      </Box>

      {/* Confirmación de logout */}
      <Dialog open={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <DialogTitle>¿Cerrar sesión?</DialogTitle>
        <DialogContent>
          <DialogContentText>Se cerrará tu sesión en el panel administrativo.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogout(false)}>Cancelar</Button>
          <Button onClick={handleLogout} color="error" variant="contained" startIcon={<LogoutRounded />}>
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
