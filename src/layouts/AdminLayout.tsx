import { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from '@mui/material';
import { supabase } from "../components/lib/supabaseClient.ts";
import MenuIcon from '@mui/icons-material/Menu';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import HealingIcon from '@mui/icons-material/Healing';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BusinessIcon from '@mui/icons-material/Business'; 

import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidthExpanded = 230;
const drawerWidthCollapsed = 70;

const navItems = [
  { text: 'Registrar Cliente', icon: <PersonAddIcon />, path: '/register-client' },
  { text: 'Historial Cliente', icon: <HistoryIcon />, path: '/history-client' },
  { text: 'Servicios', icon: <BuildIcon />, path: '/services' },
  { text: 'Formularios', icon: <HealingIcon />, path: '/allergy' },
  { text: 'Agendar cita', icon: <CalendarMonthIcon />, path: '/agendar' },
  { text: 'Ver cita', icon: <EventNoteIcon />, path: '/ver-cita' },
  { text: 'Registrar Empresa', icon: <BusinessIcon />, path: '/register-company', role: 'superadmin' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const role = user?.user_metadata?.role;
      setUserRole(role ?? null);
    });
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

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* TOPBAR */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', marginRight: collapsed ? 6 : 0 }}>
            BRUSH ART NAILS - Panel Administrativo
          </Typography>

          <Button color="inherit" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR */}
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
        <Toolbar />
        <List>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive}
                  sx={{
                    ...(isActive && {
                      backgroundColor: '#e0e0e0',
                      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                        color: 'primary.main',
                        fontWeight: 'bold',
                      },
                    }),
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {!collapsed && <ListItemText primary={item.text} />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* CONTENIDO PRINCIPAL */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
