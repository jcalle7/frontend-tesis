import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Stack, Alert, DialogContentText
} from '@mui/material';
import { useState } from 'react';
import BookingWidget from '../componentsLanding/BookingWidget'; 

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (fecha: string, comprobante: File | null) => void;
  selectedServices: any[];
  bankAccount: string;
  companyId: string;
  staffId: string;
  idNumber?: string; 
}

export default function AppointmentModal({
  open,
  onClose,
  onConfirm,
  selectedServices,
  bankAccount,
  companyId,
  staffId,
  idNumber
}: AppointmentModalProps) {
  const [fechaISO, setFechaISO] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const uuidRe = /^[0-9a-fA-F-]{36}$/;

const serviceIds: string[] = selectedServices
  .map((s) => (typeof s?.id === 'object' ? s?.id?.id : s?.id))
  .filter((id: any): id is string => typeof id === 'string' && uuidRe.test(id));

const ready = Boolean(companyId && staffId && serviceIds.length > 0);

  const handleConfirmClick = () => {
    if (!fechaISO) {
      alert('Selecciona la fecha y hora');
      return;
    }
    setConfirmOpen(true); 
  };
  
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Agendar cita para: {selectedServices.map(s => s.name).join(', ')}</DialogTitle>
        <DialogContent dividers>
          <Typography mb={2}>
            Debes depositar el 50% del servicio al siguiente número de cuenta:
          </Typography>
          <Alert severity="info" sx={{ mb: 2, fontWeight: 500 }}>
            {bankAccount && <DialogContentText>Cuenta: {bankAccount}</DialogContentText>}
            {idNumber && <DialogContentText>Cédula/RUC: {idNumber}</DialogContentText>}
          </Alert>

          <Stack spacing={2}>
            {/* Selector con días y horas disponibles (no inserta; solo selecciona) */}
          {ready ? (
          <BookingWidget
          companyId={companyId}
          staffId={staffId}
          serviceIds={serviceIds}
          onSelect={(slot) => setFechaISO(new Date(slot.slot_start).toISOString())}
        />
        ) : (
        <Typography variant="body2" color="text.secondary">
          Selecciona al menos un servicio y espera a que cargue la agenda…
        </Typography>
         )}

          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" color="error">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmClick}
            variant="contained"
            color="primary"
          >
            Confirmar cita
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE ADVERTENCIA */}
    <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
    <DialogTitle>⚠️ Confirmación de cita</DialogTitle>
    <DialogContent>
    <DialogContentText mb={2}>
    Recuerda que debes realizar el pago del 50% para confirmar tu cita.
    </DialogContentText>

    <Button
    variant="outlined"
    component="label"
    color="success"
    sx={{ fontWeight: 500 }}
    >
    Seleccionar comprobante de pago
    <input
        type="file"
        hidden
        accept="image/*"
        onChange={(e) => {
        if (e.target.files?.[0]) setComprobante(e.target.files[0]);
        }}
    />
    </Button>

    {comprobante && (
    <Typography variant="body2" color="text.secondary" mt={1}>
        Archivo: {comprobante.name}
    </Typography>
    )}
</DialogContent>

<DialogActions>
    <Button onClick={() => setConfirmOpen(false)} color="error">
    Cancelar
    </Button>
    <Button
    onClick={() => {
        if (!comprobante) return alert('Debes seleccionar el comprobante');
        onConfirm(fechaISO!, comprobante);
        setConfirmOpen(false);
    }}
    variant="contained"
    color="primary"
    >
    Entiendo y continuar
    </Button>
</DialogActions>
</Dialog>
    </>
);
}
