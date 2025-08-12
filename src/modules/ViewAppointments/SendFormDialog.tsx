import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { supabase } from "../../components/lib/supabaseClient";

interface FormItem {
  id: string;
  title: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  clientPhone: string;
  companyId: string;
  clientName: string;
  clientId: string;
}

export default function SendFormDialog({
  open,
  onClose,
  clientPhone,
  companyId,
  clientName,
  clientId,
}: Props) {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchForms = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_forms")
        .select("id, title")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (!error) setForms(data);
      setLoading(false);
    };

    fetchForms();
  }, [open, companyId]);

const handleSend = (formId: string) => {
  const url = `${window.location.origin}/formularios/llenar/${formId}/${clientId}`;
  const numero = clientPhone.replace(/\D/g, "");
  if (!numero || numero.length < 10) {
    alert("Número de teléfono inválido");
    return;
  }

  const mensaje = `Hola ${clientName}, por favor completa el formulario: ${url}`;
  const whatsappURL = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  window.open(whatsappURL, "_blank");
  onClose();
};

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Enviar formulario por WhatsApp</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : forms.length === 0 ? (
          <Typography>No hay formularios disponibles.</Typography>
        ) : (
          <List>
            {forms.map((form) => (
              <ListItemButton key={form.id} onClick={() => handleSend(form.id)}>
                <ListItemText primary={form.title} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
