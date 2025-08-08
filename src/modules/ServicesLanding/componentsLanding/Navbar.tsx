import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Stack, Avatar,
  Menu, MenuItem, IconButton
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { Dispatch, SetStateAction } from 'react';
import { Badge } from '@mui/material'; 

function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function stringAvatar(name: string) {
  const names = name.split(' ');
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: 40,
      height: 40,
      fontSize: 16,
      fontWeight: 500,
    },
    children: `${names[0]?.[0] ?? ''}${names[1]?.[0] ?? ''}`,
  };
}

interface NavbarProps {
  userName: string;
  companyName: string;
  carrito: any[];
  setShowCart: Dispatch<SetStateAction<boolean>>;
}

const Navbar: React.FC<NavbarProps> = ({ userName, companyName, carrito, setShowCart }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await import('../../../components/lib/supabaseClient').then(({ supabase }) =>
      supabase.auth.signOut().then(() => {
        window.location.href = '/login'; 
      })
    );
  };

  const handleMisCitas = () => {
    handleClose();
    window.location.href = '/mis-citas'; 
  };

  return (
    <AppBar position="sticky" color="default" elevation={2}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>

        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {companyName}
        </Typography>

        <Stack direction="row" spacing={3}>
          <Button color="inherit" onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>
            Servicios
          </Button>
          <Button color="inherit" onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}>
            Contacto
          </Button>
          <Button color="inherit" startIcon={<Badge badgeContent={carrito.length} color="error"> 
          <ShoppingCart /> 
          </Badge>} 
          onClick={() => setShowCart(prev => !prev)}
          >
            Carrito
          </Button>

          <IconButton onClick={handleAvatarClick}>
            <Avatar {...stringAvatar(userName)} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleMisCitas}>Mis citas</MenuItem>
            <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
