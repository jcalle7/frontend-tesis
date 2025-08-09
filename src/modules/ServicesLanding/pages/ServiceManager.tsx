import React, { useState, useEffect } from 'react';
import {Box, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import { GridPaginationModel } from '@mui/x-data-grid';
import ServiceFormModal from '../../ServicesLanding/ServiceFormModal.tsx';
import ServiceTable from '../../ServicesLanding/ServiceTable.tsx';
import { ServiceData, useServices } from '../../ServicesLanding/hooks/useServices.ts';
import { TransitionProps } from '@mui/material/transitions';
import { containerStylesServices, titleStylesServices } from '../../ServicesLanding/Styles/ServiceLandingPage.styles.ts';
import LandingForm from '../../ServicesLanding/LandingForm.tsx';
import { supabase } from '../../../components/lib/supabaseClient.ts';

const Transition = React.forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

export default function ServiceManager() {
  const { services, createOrUpdateService, deleteService } = useServices();

  // Estados para servicios
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<ServiceData, 'id'>>({
    nombre: '',
    precio: '',
    duracion: '',
    descripcion: '',
    imagen: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Estados para configuración de landing
  const [landingForm, setLandingForm] = useState({
    cover_url: '',
    title: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    phone: '',
    address: '',
    email: '',
    bank_account: ''
  });
  const [initialLanding, setInitialLanding] = useState<typeof landingForm | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');

  const fetchLandingData = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return;

    const { data: companyData } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.user.id)
      .single();

    if (!companyData?.company_id) return;

    setCompanyId(companyData.company_id);

    if (companyData.company_id) {
    console.log("company_id desde company_users:", companyData.company_id);
    const { data: companyDetails, error: slugError } = await supabase
    .from('companies')
    .select('id, slug, name')
    .eq('id', companyData.company_id)
    .maybeSingle();

    if (companyDetails?.slug) {
    setCompanySlug(companyDetails.slug);
    }
    setCompanyName(companyDetails?.name || '');

    if (slugError) {
      console.error('❌ Error obteniendo slug:', slugError.message);
    }

    if (companyDetails?.slug) {
      setCompanySlug(companyDetails.slug);

      console.log('✅ Slug de la empresa:', companyDetails.slug);
    } else {
      console.warn('⚠️ La empresa no tiene slug registrado en Supabase.');
    }
};

    const { data: existingLanding } = await supabase
      .from('landing_data')
      .select('*')
      .eq('company_id', companyData.company_id)
      .maybeSingle();

    if (existingLanding) {
      const fullLanding = {
        cover_url: existingLanding.cover_url ?? '',
        title: existingLanding.title ?? '',
        facebook_url: existingLanding.facebook_url ?? '',
        instagram_url: existingLanding.instagram_url ?? '',
        tiktok_url: existingLanding.tiktok_url ?? '',
        phone: existingLanding.phone ?? '',
        address: existingLanding.address ?? '',
        email: existingLanding.email ?? '',
        bank_account: existingLanding.bank_account ?? ''
    };

    setLandingForm(fullLanding);
    setInitialLanding(fullLanding);
    }
  };

  useEffect(() => {
    fetchLandingData();
  }, []);

  const handleLandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

  setLandingForm((prev) => ({ ...prev, [name]: value }));
  const hasChanges = JSON.stringify(landingForm) !== JSON.stringify(initialLanding);
  };

  const handleLandingImageChange = async (file: File) => {
    const filePath = `portadas/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('imagenes').upload(filePath, file);
    if (error) {
      setSnackbar({ open: true, message: '❌ Error subiendo imagen.', severity: 'error' });
      return;
    }
    const { data } = supabase.storage.from('imagenes').getPublicUrl(filePath);
    setLandingForm((prev) => ({ ...prev, cover_url: data.publicUrl }));
  };

const handleLandingSubmit = async () => {
  if (!companyId) return;

  const { data: existing } = await supabase
    .from('landing_data')
    .select('id')
    .eq('company_id', companyId)
    .single();

  const cleanedLanding = {
    cover_url: landingForm.cover_url,
    title: landingForm.title,
    facebook_url: landingForm.facebook_url,
    instagram_url: landingForm.instagram_url,
    tiktok_url: landingForm.tiktok_url,
    phone: landingForm.phone,
    address: landingForm.address,
    email: landingForm.email,
    bank_account: landingForm.bank_account
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from('landing_data')
      .update(cleanedLanding)
      .eq('company_id', companyId);

    if (updateError) {
      setSnackbar({ open: true, message: '❌ Error actualizando landing.', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: `✅ Se actualizó la landing de ${companyName} correctamente.`, severity: 'success' });
      setInitialLanding({ ...landingForm });
    }
  } else {
    const { error: insertError } = await supabase
      .from('landing_data')
      .insert([{ company_id: companyId, ...cleanedLanding }]);

    if (insertError) {
      setSnackbar({ open: true, message: '❌ Error creando landing.', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: '✅ Landing creada.', severity: 'success' });
      setInitialLanding({ ...landingForm });
    }
  }
};

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'imagen' && files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setFormData((prev) => ({ ...prev, imagen: reader.result as string }));
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async () => {
    try {
      await createOrUpdateService(formData, editingId || undefined);
      setSnackbar({ open: true, message: editingId ? '✅ Servicio actualizado.' : '✅ Servicio creado.', severity: 'success' });
      setFormOpen(false);
      setFormData({ nombre: '', precio: '', duracion: '', descripcion: '', imagen: '' });
      setEditingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleEdit = (service: ServiceData) => {
    setFormData({
      nombre: service.nombre,
      precio: service.precio,
      duracion: service.duracion,
      descripcion: service.descripcion,
      imagen: service.imagen,
    });
    setEditingId(service.id);
    setFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteService(confirmDeleteId);
      setSnackbar({ open: true, message: '✅ Servicio eliminado.', severity: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '❌ Error al eliminar.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setConfirmDeleteId(null);
    }
  };
  const hasChanges = initialLanding !== null && JSON.stringify(landingForm) !== JSON.stringify(initialLanding);

  return (
    <Box sx={containerStylesServices}>
      <Typography variant="h4" sx={titleStylesServices}>
        SERVICIOS
      </Typography>
      <Button variant="contained" color="success" size="large" startIcon={<SaveIcon />} onClick={() => setFormOpen(true)}>
        AÑADIR
      </Button>

      <ServiceFormModal
        open={formOpen}
        formData={formData}
        onClose={() => setFormOpen(false)}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        editing={editingId !== null}
      />

      <ServiceTable
        services={services}
        onEdit={handleEdit}
        onDelete={setConfirmDeleteId}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
      />

      <LandingForm
        formData={landingForm}
        onChange={handleLandingChange}
        onImageChange={handleLandingImageChange}
        onSubmit={handleLandingSubmit}
        disabled={!hasChanges}
      />

      {companySlug && (
      <Box mt={3} display="flex" justifyContent="center">
      <Button
      variant="outlined"
      color="info"
      size="large"
      startIcon={<VisibilityIcon />}
      onClick={() => window.open(`/empresa/${companySlug}`, '_blank')}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        px: 3,
        borderRadius: 2,
      }}
      >
      Ver mi landing
      </Button>
      </Box>
    )}

      <Dialog open={confirmDeleteId !== null} TransitionComponent={Transition} keepMounted onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>¿Seguro que quieres eliminar este servicio?</DialogTitle>
        <DialogContent>
          <DialogContentText>Esta acción no se puede deshacer. ¿Deseas continuar?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
          <Button color="error" onClick={handleConfirmDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
