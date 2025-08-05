import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

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
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (file: File) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function LandingForm({ formData, onChange, onImageChange, onSubmit, disabled }: Props) {
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

      <Button
        component="label"
        variant="outlined"
        fullWidth
        sx={{
          mt: 2,
          color: 'primary.main',
          borderColor: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.light',
            borderColor: 'primary.main',
          }
        }}
        startIcon={<AddPhotoAlternateIcon />}
      >
        Subir imagen de portada
        <input
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) onImageChange(e.target.files[0]);
          }}
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

      <Button variant="contained" color="primary" onClick={onSubmit} disabled={disabled} sx={{ mt: 3 }}>
        Guardar configuración
      </Button>
    </Box>
  );
}
