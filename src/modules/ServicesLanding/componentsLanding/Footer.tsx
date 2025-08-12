// src/modules/ServicesLanding/componentsLanding/Footer.tsx
import React, { memo } from 'react';
import '../pages/footerStyles/footer.css';
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';

type Landing = {
  title?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  whatsapp_url?: string;
  whatsapp_number?: string;
} | null;

type FooterProps = {
  companyId?: string;              // <- para forzar rerender por empresa
  companyName?: string;
  landing?: Landing;
};

const Footer: React.FC<FooterProps> = ({ companyId, companyName = 'Brush Art Nails', landing }) => {
  const initials = (companyName || 'BA').trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const waLink =
    landing?.whatsapp_url ||
    (landing?.whatsapp_number ? `https://wa.me/${landing.whatsapp_number.replace(/\D/g, '')}` : undefined);

  const hasSocial = !!(landing?.facebook_url || landing?.instagram_url || landing?.tiktok_url || waLink);
  const hasContact = !!(landing?.phone || landing?.email || landing?.address);

  return (
    <footer className="footer" key={companyId /* cambia al cambiar de empresa */}>
      <div className="footer-inner">
        {/* Marca */}
        <div className="foot-brand">
          <div className="logo-circle">{initials}</div>
          <h4>{companyName}</h4>
          <p className="tagline">{landing?.title || 'Belleza y cuidado con detalle.'}</p>

          {hasSocial && (
            <div className="foot-social">
              {landing?.facebook_url && (
                <a href={landing.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <FaFacebook />
                </a>
              )}
              {landing?.instagram_url && (
                <a href={landing.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <FaInstagram />
                </a>
              )}
              {landing?.tiktok_url && (
                <a href={landing.tiktok_url} target="_blank" rel="noreferrer" aria-label="TikTok">
                  <FaTiktok />
                </a>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                  <FaWhatsapp />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Enlaces */}
        <nav className="foot-links">
          <h5>Enlaces</h5>
          <a href="#servicios">Servicios</a>
          <a href="#contacto">Contacto</a>
          <a href="#ubicacion">Ubicación</a>
        </nav>

        {/* Contacto (solo si hay datos) */}
        {hasContact && (
          <div className="foot-contact">
            <h5>Contáctanos</h5>
            {landing?.phone && <p>📞 {landing.phone}</p>}
            {landing?.email && <p>✉️ {landing.email}</p>}
            {landing?.address && <p>📍 {landing.address}</p>}
          </div>
        )}
      </div>

      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} {companyName}</span>
        <div className="foot-legal">
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
