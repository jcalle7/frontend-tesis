import React from 'react';
import {
  Drawer, IconButton, Typography, Divider, Box, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, Button, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url?: string;
}

interface CartProps {
  carrito: CartItem[];
  setCarrito: (items: CartItem[]) => void;
  onPagar: () => void;
}

export default function Cart({ carrito, setCarrito, onPagar }: CartProps) {
  const total = carrito.reduce((acc, s) => acc + s.price, 0).toFixed(2);
  const [open, setOpen] = React.useState(true);

  const handleClose = () => setOpen(false);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 390 },
          padding: 2,
          boxShadow: 4,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">Carrito de servicios</Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {carrito.length === 0 ? (
        <Typography variant="body1">El carrito está vacío.</Typography>
      ) : (
        <>
          <List>
            {carrito.map((item, index) => (
              <ListItem key={index} alignItems="flex-start" sx={{ mb: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    src={item.image_url ?? 'https://via.placeholder.com/64'}
                    sx={{ width: 56, height: 56 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={item.name}
                  secondary={`$${item.price.toFixed(2)}`}
                />
                <Button
                  color="error"
                  size="small"
                  onClick={() => {
                    const nuevo = [...carrito];
                    nuevo.splice(index, 1);
                    setCarrito(nuevo);
                  }}
                >
                  Eliminar
                </Button>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
            <Typography variant="subtitle1">${total}</Typography>
          </Box>

          <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onPagar}
          sx={{
            borderRadius: 8,
            py: 1.5,
            fontWeight: 'bold',
            fontSize: '1rem',
            mt: 2
          }}
        >
          Ir a pagar - ${total}
        </Button>
        </>
      )}
    </Drawer>
  );
}
