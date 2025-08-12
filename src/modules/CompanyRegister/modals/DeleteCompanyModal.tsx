import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Snackbar, Alert
} from '@mui/material';
import { useState } from 'react';
import { CompanyFormData } from '../TypesCompany.ts';
import { supabase } from '../../../components/lib/supabaseClient';

type Props = {
  open: boolean;
  onClose: () => void;
  empresa: CompanyFormData & { id: string } | null;
  onDelete: () => void;
};

export default function DeleteCompanyModal({ open, onClose, empresa, onDelete }: Props) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleDelete = async () => {
    if (!empresa?.id) return;

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', empresa.id);

    if (error) {
      setSnackbar({ open: true, message: '❌ Error al eliminar: ' + error.message, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: '✅ Empresa eliminada correctamente', severity: 'success' });
      onDelete();
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Eliminar Empresa</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar la empresa <strong>{empresa?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
