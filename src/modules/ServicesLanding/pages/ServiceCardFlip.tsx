import { useState } from 'react';
import '../pages/serviceCardFlip/serviceCardFlip.css';

interface Props {
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  onClick: () => void;
}

export default function ServiceCardFlip({ name, description, price, duration, image, onClick }: Props) {
  return (
    <div className="card-flip" onClick={onClick}>
      <div className="card-inner">
        {/* Frente */}
        <div className="card-front">
          <img src={image} alt={name} className="card-img" />
          <div className="card-body">
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Atrás */}
        <div className="card-back">
          <p className="text-sm text-gray-700 text-center">Precio: ${price}</p>
          <p className="text-sm text-gray-700">Duración: {duration} min</p>
          <button
            className="select-button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  );
}