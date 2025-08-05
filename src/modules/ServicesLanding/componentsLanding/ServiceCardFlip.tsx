import { useState } from 'react';
import '../pages/serviceCardFlip/serviceCardFlip.css';

interface Props {
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  onClick: () => void;
  onAddToCart: () => void;
  selected: boolean;
}

export default function ServiceCardFlip({
  name,
  description,
  price,
  duration,
  image,
  onClick,
  onAddToCart,
  selected,
}: Props) {
  return (
    <div className={`card-flip ${selected ? 'selected' : ''}`}>
      <div className="card-inner">
        {/* Frente */}
        <div className="card-front">
          <img src={image} alt={name} className="card-img" />
          <div className="card-body">
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Reverso */}
        <div className="card-back">
          <p className="text-sm font-medium text-gray-800">Precio: ${price}</p>
          <p className="text-sm text-gray-700">Duración: {duration} min</p>
          <button
            className="select-button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
              onAddToCart();
            }}
          >
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  );
}