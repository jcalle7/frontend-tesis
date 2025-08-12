import { Box, TextField, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AppointmentTable from "./AppoinmentsTable";
import { AppointmentData, EstadoCita } from "./TypesCitas";
import { useEffect, useState } from "react";
import { supabase } from "../../components/lib/supabaseClient";
import SendFormDialog from "../ViewAppointments/SendFormDialog";
import dayjs from 'dayjs';

export default function AppointmentListPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedClient, setSelectedClient] = useState<AppointmentData | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});

  // Modal comprobante
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Modal respuestas por cliente
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responses, setResponses] = useState<any[]>([]); // {id, created_at, custom_forms:{title}, responses}
  const [responsesClientName, setResponsesClientName] = useState<string>('');

  const handleSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const handleAccept = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "aceptada" }).eq("id", id);
    if (!error) {
      setAppointments(prev => prev.map(appt => appt.id === id ? { ...appt, estado: "aceptada" } : appt));
      handleSnackbar("✅ Cita aceptada correctamente", "success");
    } else handleSnackbar("❌ Error al aceptar la cita", "error");
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelada" }).eq("id", id);
    if (!error) {
      setAppointments(prev => prev.map(appt => appt.id === id ? { ...appt, estado: "cancelada" } : appt));
      handleSnackbar("✅ Cita cancelada correctamente", "success");
    } else handleSnackbar("❌ Error al cancelar la cita", "error");
  };

  // WhatsApp recordatorio
  const handleRemind = (id: string) => {
    const cita = appointments.find(a => a.id === id);
    if (!cita || !cita.telefono) return;

    const numero = cita.telefono.replace(/\D/g, '');
    const fecha = dayjs(`${cita.fecha}T${cita.hora}`).format('DD/MM/YYYY HH:mm');
    const mensaje = `Hola ${cita.nombre}, te recordamos tu cita para el ${fecha}. Si necesitas reprogramar, por favor responde este mensaje.`;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Abrir comprobante
  const handleViewReceipt = (url: string) => {
    setReceiptUrl(url);
    setReceiptOpen(true);
  };

  // Ver respuestas (client_id)
const handleViewResponses = async (clientId: string) => {
  if (!companyId) return;
  setResponsesOpen(true);
  setResponsesLoading(true);
  setLabelMap({});

  try {
    const client = appointments.find(a => a.clientId === clientId);
    setResponsesClientName(client?.nombre ?? 'Cliente');

    // 1) Trae respuestas + form_id + (title, fields)
    const { data: subs, error } = await supabase
      .from('form_submissions')
      .select('id, created_at, responses, form_id, custom_forms(title, fields)')
      .eq('company_id', companyId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const submissions = subs || [];
    setResponses(submissions);

    // 2) Construye labels usando primero custom_forms.fields (si existen)
    const tmpLabels: Record<string, string> = {};
    const formIdsNeedingQuestions = new Set<string>();

    submissions.forEach((s: any) => {
      const fields = Array.isArray(s.custom_forms?.fields) ? s.custom_forms!.fields : [];
      if (fields.length) {
        fields.forEach((f: any) => {
          if (f?.id && f?.label) tmpLabels[f.id] = f.label;
        });
      } else if (s.form_id) {
        formIdsNeedingQuestions.add(s.form_id);
      }
    });

    // 3) Para forms sin fields, usa custom_form_questions
    if (formIdsNeedingQuestions.size) {
      const { data: qs } = await supabase
        .from('custom_form_questions')
        .select('id, form_id, question')
        .in('form_id', Array.from(formIdsNeedingQuestions));

      (qs || []).forEach((q: any) => {
        if (q.id && q.question) tmpLabels[q.id] = q.question;
      });
    }

    setLabelMap(tmpLabels);
  } catch (e) {
    console.error(e);
  } finally {
    setResponsesLoading(false);
  }
};

  const handleSendForm = (id: string) => {
    const cita = appointments.find((a) => a.id === id);
    if (!cita || !cita.telefono) return;
    setSelectedClient(cita);
    setOpenDialog(true);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: empresaData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      setCompanyId(empresaData?.company_id);

      const { data, error } = await supabase
        .from("appointments")
        .select("id, date, time, status, phone, comprobante_url, client_id, clients(first_name, last_name, phone)")
        .eq("company_id", empresaData?.company_id)
        .neq("status", "terminada")
        .order("date", { ascending: true });

      if (!error && data) {
        const parsed: AppointmentData[] = data.map((item: any) => ({
          id: item.id,
          nombre: `${item.clients?.first_name ?? ""} ${item.clients?.last_name ?? ""}`,
          estado: (item.status?.toLowerCase() ?? 'pendiente') as EstadoCita,
          fecha: item.date,
          hora: item.time,
          telefono: item.clients?.phone ?? item.phone ?? "",
          clientId: item.client_id,
          comprobante: item.comprobante_url ?? null,
        }));
        setAppointments(parsed);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ mt: 11, px: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        VER CITA
      </Typography>

      <TextField
        label="Buscar cliente"
        placeholder="Buscar cliente..."
        fullWidth
        sx={{ mb: 4 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{ endAdornment: <SearchIcon /> }}
      />

      <AppointmentTable
        rows={filteredAppointments}
        onAccept={handleAccept}
        onCancel={handleCancel}
        onSendForm={handleSendForm}
        onRemind={handleRemind}
        onViewReceipt={handleViewReceipt}
        onViewResponses={handleViewResponses}
      />

      {selectedClient && companyId && (
        <SendFormDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          clientPhone={selectedClient.telefono!}
          clientName={selectedClient.nombre}
          clientId={selectedClient.clientId}
          companyId={companyId}
        />
      )}

      {/* Modal: Ver comprobante */}
      <Dialog open={receiptOpen} onClose={() => setReceiptOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Comprobante de pago</DialogTitle>
        <DialogContent dividers>
          {receiptUrl?.toLowerCase().endsWith('.pdf') ? (
            <object data={receiptUrl!} type="application/pdf" width="100%" height="600px">
              <p>No se puede mostrar el PDF. <a href={receiptUrl!} target="_blank">Abrir en otra pestaña</a></p>
            </object>
          ) : (
            <img src={receiptUrl ?? ''} alt="Comprobante" style={{ width: '100%', borderRadius: 8 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptOpen(false)}>Cerrar</Button>
          {receiptUrl && (
            <Button component="a" href={receiptUrl} target="_blank" rel="noopener noreferrer">
              Abrir en pestaña
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal: Ver respuestas de formularios */}
<Dialog open={responsesOpen} onClose={() => setResponsesOpen(false)} fullWidth maxWidth="md">
  <DialogTitle>Respuestas de {responsesClientName}</DialogTitle>
  <DialogContent dividers>
    {responsesLoading ? (
      <Typography>Cargando…</Typography>
    ) : responses.length === 0 ? (
      <Typography>No hay respuestas todavía.</Typography>
    ) : (
      <Box sx={{ display: 'grid', gap: 2 }}>
        {responses.map((r: any) => {
          const entries = Object.entries(r.responses || {});
          const when = new Date(r.created_at);
          const fecha = new Intl.DateTimeFormat('es-EC', {
            dateStyle: 'short', timeStyle: 'medium'
          }).format(when);

          return (
            <Box key={r.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                {r.custom_forms?.title || 'Formulario'} — {fecha}
              </Typography>

              {entries.length === 0 ? (
                <Typography color="text.secondary">Sin respuestas.</Typography>
              ) : (
                <Box component="dl" sx={{ m: 0, display: 'grid', rowGap: 1.25 }}>
                  {entries.map(([qid, val]) => {
                    const label = labelMap[qid] || qid;
                    const pretty = Array.isArray(val)
                      ? val.join(', ')
                      : typeof val === 'boolean'
                        ? (val ? 'Sí' : 'No')
                        : (val ?? '—');
                    return (
                      <Box key={qid} sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr',
                        columnGap: 2,
                        alignItems: 'start',
                        borderBottom: '1px dashed rgba(0,0,0,0.08)',
                        pb: 1
                      }}>
                        <Typography component="dt" sx={{ fontWeight: 600 }}>
                          {label}
                        </Typography>
                        <Typography component="dd" sx={{ m: 0, whiteSpace: 'pre-wrap' }}>
                          {String(pretty)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setResponsesOpen(false)}>Cerrar</Button>
  </DialogActions>
</Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
