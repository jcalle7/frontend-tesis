import { Box, TextField, Typography, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClientTable from "./ClientTable.tsx";
import { ClientHistory } from "./TypesHistory.tsx";
import { useEffect, useState } from 'react';
import { supabase } from '../../components/lib/supabaseClient.ts';

async function fetchClientHistory(): Promise<ClientHistory[]> {
  const { data: user } = await supabase.auth.getUser();
  const userId = user?.user?.id;
  if (!userId) return [];

  const { data: empresaData } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', userId)
    .single();

  const companyId = empresaData?.company_id;
  console.log("🔍 Empresa del usuario:", companyId);

  if (!companyId) return [];

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companyId);

  console.log("🧪 Resultado de consulta a 'clients':", clients, "para company_id:", companyId);
  console.log("📋 Clientes encontrados:", clients);

  if (!clients) return [];

  const clientHistoryList: ClientHistory[] = [];

  for (const client of clients) {
    console.log("🧍 Procesando cliente:", client);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('client_id', client.id)
      .eq('company_id', companyId);

    console.log("📅 Citas para el cliente:", appointments);

    const citasValidas = appointments ?? [];

    const serviciosSet = new Set<string>();
    for (const cita of citasValidas) {
      console.log("🔗 Buscando servicios de cita:", cita.id);

      const { data: serviciosRelacionados } = await supabase
        .from('appointment_services')
        .select('service_id')
        .eq('appointment_id', cita.id);

      console.log("🧾 Servicios relacionados:", serviciosRelacionados);

      const ids = serviciosRelacionados?.map(r => r.service_id) ?? [];

      if (ids.length > 0) {
        const { data: serviciosNombres, error } = await supabase
          .from('services')
          .select('id, name')
          .in('id', ids)
          .eq('company_id', companyId);

        if (error) {
          console.error("🚨 Error al obtener nombres de servicios:", error);
        }

          console.log("🧠 IDs a buscar en services:", ids);
          console.log("📦 Resultado completo de servicios:", serviciosNombres);

        serviciosNombres?.forEach(s => {
          if (s?.name) serviciosSet.add(s.name);
        });
      }
    }

    const clienteFinal: ClientHistory = {
      id: client.id,
      nombre: `${client.first_name} ${client.last_name}`,
      telefono: client.phone,
      citasPasadas: citasValidas.length,
      servicios: Array.from(serviciosSet),
      alertaSalud: client.comments?.toLowerCase().includes('alergia') ?? false,
      detalleAlerta: client.comments ?? '',
    };

    console.log("✅ Cliente agregado al historial:", clienteFinal);

    clientHistoryList.push(clienteFinal);
  }

  console.log("📊 Resultado final:", clientHistoryList);
  return clientHistoryList;
}

export default function ClientHistoryPage() {
  const [data, setData] = useState<ClientHistory[]>([]);
  const [filteredData, setFilteredData] = useState<ClientHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClientHistory().then((res) => {
      setData(res);
      setFilteredData(res);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = data.filter(client =>
      client.nombre.toLowerCase().includes(term) ||
      client.telefono.toLowerCase().includes(term)
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

  return (
    <Box sx={{ mt: 11, px: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        HISTORIAL CLIENTE
      </Typography>

      <TextField
        label="Buscar"
        placeholder="Buscar por nombre o teléfono..."
        fullWidth
        sx={{ mb: 4 }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          endAdornment: <SearchIcon />,
        }}
      />

      {loading ? <p>Cargando historial...</p> : <ClientTable rows={filteredData} />}

      <Stack direction="row" spacing={2} justifyContent="center" mt={3} />
    </Box>
  );
}
