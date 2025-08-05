import React from 'react';
import { Button } from '@mui/material';
import '../pages/landingStyles/landingStyles.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url?: string;
}

interface CartProps {
  carrito: CartItem[];
  setCarrito: (items: CartItem[]) => void;
}

export default function Cart({ carrito, setCarrito }: CartProps) {
  const total = carrito.reduce((acc, s) => acc + s.price, 0).toFixed(2);

  return (
    <section className="cart-panel">
      <h3 className="text-xl font-bold mb-4">Carrito de compras</h3>

      <div className="rounded-lg bg-gray-50 p-4 mb-4 space-y-4">
        {carrito.map((item, index) => (
          <div key={index} className="flex items-start gap-4 py-3 rounded-lg hover:bg-gray-100 transition">
            <img
              src={item.image_url ?? 'https://via.placeholder.com/80x80?text=Servicio'}
              alt={item.name}
              className="cart-item-img"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-semibold">{item.name}</h4>
                <p className="text-sm font-medium text-gray-700">${item.price.toFixed(2)}</p>
              </div>
              <Button
                variant="contained"
                color="error"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  const nuevoCarrito = [...carrito];
                  nuevoCarrito.splice(index, 1);
                  setCarrito(nuevoCarrito);
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="contained"
        color="primary"
        fullWidth
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
    </section>
  );
}
