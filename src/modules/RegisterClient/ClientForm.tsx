import { Alert, Box, Button, Snackbar, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';
import { useState, useEffect } from 'react';
import { ClientFormData } from '../RegisterClient/TypesRegister.tsx';
import { formContainer, buttonGroup, buttonStyle } from "./Styles/ClientForm.styles.ts";
import { supabase } from "../../components/lib/supabaseClient.ts";
import { useNavigate } from 'react-router-dom';
import React from "react";

const initialForm: ClientFormData = {
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  comentarios: '',
};

export default function ClientForm() {
  const [formData, setFormData] = useState<ClientFormData>(initialForm);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyId = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      const { data, error: _error } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.user.id)
        .single();

      if (data?.company_id) {
        setCompanyId(data.company_id);
      } else {
        setSnackbar({ open: true, message: '⚠️ No se encontró la empresa asociada.', severity: 'error' });
      }
    };

    fetchCompanyId();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      setSnackbar({ open: true, message: '⚠️ No se pudo asociar cliente a una empresa.', severity: 'error' });
      return;
    }

    const { error } = await supabase.from('clients').insert([{
      first_name: formData.nombres,
      last_name: formData.apellidos,
      phone: formData.telefono,
      email: formData.correo,
      comments: formData.comentarios || '',
      company_id: companyId
    }]);

    if (error) {
      setSnackbar({ open: true, message: '❌ Error al guardar el cliente.', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: '✅ Cliente guardado con éxito', severity: 'success' });
      setFormData(initialForm);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={formContainer}>
      <TextField required label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} />
      <TextField required label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} />
      <TextField required label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
      <TextField required label="Correo" name="correo" value={formData.correo} onChange={handleChange} />
      <TextField multiline rows={3} label="Comentarios" name="comentarios" value={formData.comentarios} onChange={handleChange} />

      <Box sx={buttonGroup}>
        <Button type="submit" variant="contained" color="success" size="large" startIcon={<SaveIcon />} sx={buttonStyle}>
          GUARDAR
        </Button>
        <Button variant="contained" color="primary" size="large" startIcon={<ListIcon />} sx={buttonStyle} onClick={() => navigate('/clientes')}>
          LISTAR CLIENTES
        </Button>
      </Box>

      {/* Renderiza el Snackbar correctamente */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
