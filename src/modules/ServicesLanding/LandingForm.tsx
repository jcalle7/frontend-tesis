import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import MuiLink from '@mui/material/Link';

interface Props {
  formData: {
    cover_url: string;
    title: string;
    facebook_url: string;
    instagram_url: string;
    tiktok_url: string;
    phone: string;
    address: string;
    email: string;
    bank_account: string;
    cedula?: string;
    whatsapp_url?: string;
    whatsapp_number?: string;
    map_url?: string;
    bank_type?: string;
    bank_qr_url?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (file: File) => void;
  onQrChange: (file: File) => void;                     
  onSubmit: () => void;
  disabled: boolean;
}

export default function LandingForm({
  formData,
  onChange,
  onImageChange,
  onQrChange,                                           
  onSubmit,
  disabled
}: Props) {
  const waLink =
    formData.whatsapp_url && formData.whatsapp_url.trim().length > 0
      ? formData.whatsapp_url
      : (formData.whatsapp_number || '').replace(/\D/g, '').length
      ? `https://wa.me/${(formData.whatsapp_number || '').replace(/\D/g, '')}`
      : '';

  const mapSrc =
    (formData.map_url && formData.map_url.trim().length > 0)
      ? formData.map_url
      : (formData.address && formData.address.trim().length > 0)
      ? `https://www.google.com/maps?q=${encodeURIComponent(formData.address)}&output=embed`
      : '';

  return (
    <Box mt={5} p={3} border="1px solid #ccc" borderRadius={2}>
      <Typography variant="h6" gutterBottom>Configuración de Landing Page</Typography>

      <TextField fullWidth label="Título" name="title" value={formData.title} onChange={onChange} margin="normal" />
      <TextField fullWidth label="Facebook URL" name="facebook_url" value={formData.facebook_url} onChange={onChange} margin="normal" />
      <TextField fullWidth label="Instagram URL" name="instagram_url" value={formData.instagram_url} onChange={onChange} margin="normal" />
      <TextField fullWidth label="TikTok URL" name="tiktok_url" value={formData.tiktok_url} onChange={onChange} margin="normal" />
      <TextField fullWidth label="Teléfono" name="phone" value={formData.phone} onChange={onChange} margin="normal" />
      <TextField fullWidth label="Dirección" name="address" value={formData.address} onChange={onChange} margin="normal" />
      <TextField fullWidth label="Email" name="email" value={formData.email} onChange={onChange} margin="normal" />

      <TextField fullWidth label="Cuenta bancaria" name="bank_account" value={formData.bank_account} onChange={onChange} margin="normal" />
      <TextField
        fullWidth
        label="Tipo de banco"
        name="bank_type"
        value={formData.bank_type || ''}
        onChange={onChange}
        margin="normal"
        helperText="Ej: Banco Pichincha, Banco Guayaquil, JEP, etc."
      />

      <Button component="label" variant="outlined" fullWidth sx={{ mt: 1 }}>
        Subir QR de banca móvil
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { if (e.target.files?.[0]) onQrChange(e.target.files[0]); }}
        />
      </Button>

      <Box mt={1}>
        {formData.bank_qr_url
          ? <Chip label="QR subido" color="success" size="small" />
          : <Chip label="Aún no has subido el QR" size="small" />}
      </Box>

      {formData.bank_qr_url && (
        <Box mt={2}>
          <img
            src={formData.bank_qr_url}
            alt="QR Banca Móvil"
            style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 8 }}
          />
        </Box>
      )}

      <TextField
        fullWidth
        label="Cédula/RUC (para transferencias)"
        name="cedula"
        value={formData.cedula || ''}
        onChange={onChange}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        margin="normal"
      />                                                     

      <TextField
        fullWidth
        label="WhatsApp URL (opcional)"
        name="whatsapp_url"
        placeholder="https://wa.me/593999999999"
        value={formData.whatsapp_url || ''}
        onChange={onChange}
        margin="normal"
        helperText="Si usas este campo, se ignorará el 'WhatsApp (solo número)'."
      />

      <TextField
        fullWidth
        label="WhatsApp (solo número)"
        name="whatsapp_number"
        placeholder="+593999999999"
        value={formData.whatsapp_number || ''}
        onChange={onChange}
        margin="normal"
        helperText="Si completas este campo y no hay URL, se generará automáticamente el enlace wa.me."
      />

      <TextField
        fullWidth
        label="URL de mapa (opcional)"
        name="map_url"
        placeholder="https://www.google.com/maps/embed?..."
        value={formData.map_url || ''}
        onChange={onChange}
        margin="normal"
        helperText="Si está vacío, se usará la Dirección para generar el mapa."
      />

      <Button
        component="label"
        variant="outlined"
        fullWidth
        sx={{
          mt: 2,
          color: 'primary.main',
          borderColor: 'primary.main',
          '&:hover': { backgroundColor: 'primary.light', borderColor: 'primary.main' }
        }}
        startIcon={<AddPhotoAlternateIcon />}
      >
        Subir imagen de portada
        <input
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => { if (e.target.files?.[0]) onImageChange(e.target.files[0]); }}
        />
      </Button>

      {formData.cover_url && (
        <Box mt={2}>
          <img
            src={formData.cover_url}
            alt="Portada"
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }}
          />
        </Box>
      )}

      {(waLink || mapSrc) && (
        <Box mt={2}>
          {waLink && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Enlace de WhatsApp:{' '}
              <MuiLink href={waLink} target="_blank" rel="noopener">{waLink}</MuiLink>
            </Typography>
          )}
          {mapSrc && (
            <Box sx={{ width: '100%', height: 240 }}>
              <iframe
                title="Vista previa mapa"
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>
          )}
        </Box>
      )}

      <Button variant="contained" color="primary" onClick={onSubmit} disabled={disabled} sx={{ mt: 3 }}>
        Guardar configuración
      </Button>
    </Box>
  );
}
