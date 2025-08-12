import React from 'react';
import '../pages/serviceCardFlip/serviceCardFlip.css';

type Props = {
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  onClick?: () => void;
  onAddToCart?: () => void;
  selected?: boolean;
  extrasNote?: string; // opcional
};

const ServiceCardFlip: React.FC<Props> = ({
  name,
  description,
  price,
  duration,
  image,
  onClick,
  onAddToCart,
  selected,
  extrasNote,
}) => {
  return (
    <div className={`card-flip${selected ? ' selected' : ''}`} onClick={onClick}>
      <div className="card-inner">
        {/* Frente */}
        <div className="card-front">
          <div className="card-badges">
            <span className="badge price">Desde ${price}</span>
          </div>

          <img className="card-img" src={image} alt={name} />
          <div className="card-body">
            <h3>{name}</h3>
            <p>{description}</p>
          </div>
        </div>

        {/* Reverso */}
        <div className="card-back" onClick={(e) => e.stopPropagation()}>
          <div className="card-back-content">
            <div className="back-stats">
              <span className="badge price">Desde ${price}</span>
            </div>
            <div className="back-row">
              <span className="label">Duración:</span>
              <span className="value">{duration > 0 ? `${duration} min` : '—'}</span>
            </div>

            {extrasNote && <div className="extras-note">{extrasNote}</div>}

            <button
              type="button"
              className="select-button"
              onClick={() => onAddToCart && onAddToCart()}
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCardFlip;
