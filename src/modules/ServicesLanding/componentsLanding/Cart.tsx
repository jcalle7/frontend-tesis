import React from 'react';
import {
  Drawer, IconButton, Typography, Divider, Box, List, ListItem, Avatar, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutline';

type CartItem = {
  id: string | number;
  name?: string;
  price?: number;
  image_url?: string;
  description?: string;
};

interface CartProps {
  open: boolean;
  onClose: () => void;
  carrito: CartItem[];
  setCarrito: (items: CartItem[]) => void;
  onPagar: () => void;
}

export default function Cart({ open, onClose, carrito, setCarrito, onPagar }: CartProps) {
  const total = carrito.reduce((acc, s) => acc + Number(s.price ?? 0), 0);

  const removeAt = (index: number) => {
    const nuevo = [...carrito];
    nuevo.splice(index, 1);
    setCarrito(nuevo);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 390 },
          p: 2,
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Carrito de servicios</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {carrito.length === 0 ? (
        <Typography variant="body1">El carrito está vacío.</Typography>
      ) : (
        <>
          <List sx={{ pb: 0 }}>
            {carrito.map((item, index) => (
              <ListItem key={`${item.id}-${index}`} disableGutters sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                  {/* Imagen separada */}
                  <Avatar
                    variant="rounded"
                    src={item.image_url || 'https://via.placeholder.com/64'}
                    alt={item.name || 'Servicio'}
                    sx={{ width: 64, height: 64, borderRadius: 2, flexShrink: 0 }}
                  />

                  {/* Texto */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {item.name || 'Servicio'}
                    </Typography>
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.description}
                      </Typography>
                    )}
                  </Box>

                  {/* Precio + ícono basurero */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      ${Number(item.price ?? 0).toFixed(2)}
                    </Typography>
                    <IconButton aria-label="Eliminar" size="small" onClick={() => removeAt(index)}>
                      <DeleteOutline />
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5 }}>
            <Typography fontWeight={700}>Total:</Typography>
            <Typography fontWeight={700}>${total.toFixed(2)}</Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={onPagar}
            sx={{ borderRadius: 999, py: 1.5, fontWeight: 'bold', fontSize: '1rem', mt: 1 }}
          >
            {`IR A PAGAR - $${total.toFixed(2)}`}
          </Button>
        </>
      )}
    </Drawer>
  );
}
