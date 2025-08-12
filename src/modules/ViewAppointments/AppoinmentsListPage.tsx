import { Box, TextField, Typography, Snackbar, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AppointmentTable from "./AppoinmentsTable";
import { AppointmentData, EstadoCita } from "./TypesCitas";
import { useEffect, useState } from "react";
import { supabase } from "../../components/lib/supabaseClient";
import SendFormDialog from "../ViewAppointments/SendFormDialog";

export default function AppointmentListPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedClient, setSelectedClient] = useState<AppointmentData | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const handleSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

const handleAccept = async (id: string) => {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "aceptada" }) 
    .eq("id", id);

  if (!error) {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id ? { ...appt, estado: "aceptada" } : appt
      )
    );
    handleSnackbar("✅ Cita aceptada correctamente", "success");
  } else {
    handleSnackbar("❌ Error al aceptar la cita", "error");
  }
};

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelada" })
      .eq("id", id);

    if (!error) {
      setAppointments((prev) =>
        prev.map((appt) => appt.id === id ? { ...appt, estado: "cancelada" } : appt)
      );
      handleSnackbar("✅ Cita cancelada correctamente", "success");
    } else {
      handleSnackbar("❌ Error al cancelar la cita", "error");
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
        .order("date", { ascending: true });

      if (!error && data) {
        const parsed: AppointmentData[] = data.map((item: any) => ({
          id: item.id,
          nombre: `${item.clients?.first_name ?? ""} ${item.clients?.last_name ?? ""}`,
          estado: (item.status.toLowerCase()?? 'pendiente') as EstadoCita,
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity as any} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
