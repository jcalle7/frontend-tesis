import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Chip, List, ListItem, ListItemText,
  Divider, CircularProgress, Alert
} from '@mui/material';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import dayjs from 'dayjs';
import { supabase } from '../../components/lib/supabaseClient';

type Service = { id: string; name?: string; is_active?: boolean; company_id?: string; };
type Client = { id: string; first_name?: string; last_name?: string; company_id?: string; };
type Appointment = {
  id: string; date: string; time: string; status: string;
  client_id: string; phone?: string; company_id: string;
};

// Convierte "vanesa pérez" -> "Vanesa Pérez"
const toTitleWords = (s: string) =>
  (s || '')
    .replace(/[._-]/g, ' ')
    .split(/\s+/)
    .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();

export default function HomeDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');   // ← titular de la empresa

  const [userName, setUserName] = useState<string>('');     // nombre del usuario logueado
  const [userEmail, setUserEmail] = useState<string>('');   // correo del usuario (fallback)

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);

  // Fechas helper
  const todayStr = dayjs().format('YYYY-MM-DD');
  const weekAgoStr = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const monthStartStr = dayjs().startOf('month').format('YYYY-MM-DD');
  const monthEndStr = dayjs().endOf('month').format('YYYY-MM-DD');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('No se encontró sesión de usuario.');
          setLoading(false);
          return;
        }

        // Nombre del usuario
        const first = (user.user_metadata?.first_name as string) || '';
        const last  = (user.user_metadata?.last_name as string)  || '';
        const full  = (user.user_metadata?.name as string) || `${first} ${last}`.trim();
        setUserName(full || (user.email?.split('@')[0] ?? 'Administrador'));
        setUserEmail(user.email || '');

        // Empresa asociada
        const { data: cu } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cu?.company_id) {
          setError('No hay empresa asociada a este usuario.');
          setLoading(false);
          return;
        }
        setCompanyId(cu.company_id);

        // Trae la empresa (todas las columnas por seguridad)
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', cu.company_id)
          .maybeSingle();

        setCompanyName(comp?.name ?? '');

        // Detecta el nombre del titular según cómo lo hayas guardado
        const possibleOwner =
          (comp as any)?.owner_full_name ||
          (comp as any)?.owner_name ||
          (comp as any)?.titular ||
          (comp as any)?.contact_name ||
          (comp as any)?.representante ||
          '';
        setOwnerName(String(possibleOwner || ''));

        // Datos base
        const [{ data: cli }, { data: srv }] = await Promise.all([
          supabase.from('clients').select('*').eq('company_id', cu.company_id),
          supabase.from('services').select('*').eq('company_id', cu.company_id),
        ]);
        setClients(cli || []);
        setServices(srv || []);

        // Citas del mes (pendiente/aceptada)
        const { data: appts } = await supabase
          .from('appointments')
          .select('id, date, time, status, client_id, phone, company_id')
          .eq('company_id', cu.company_id)
          .in('status', ['pendiente', 'aceptada'])
          .gte('date', monthStartStr)
          .lte('date', monthEndStr);

        const apptsArr = appts || [];
        setMonthAppointments(apptsArr);

        // Próximas citas (>= ahora), ordenadas
        const now = dayjs();
        const upcomingSorted = apptsArr
          .map(a => ({ ...a, when: dayjs(`${a.date}T${a.time}`) }))
          .filter(a => a.when.isAfter(now))
          .sort((a, b) => a.when.valueOf() - b.when.valueOf())
          .slice(0, 5) as Appointment[];
        setUpcoming(upcomingSorted);

        // TOP servicios sin join (evita 400). Cuenta por service_id y mapea a nombre.
        const serviceIds = (srv || []).map(s => s.id);
        let apsRows: { service_id: string }[] = [];
        if (serviceIds.length) {
          const { data: aps2 } = await supabase
            .from('appointment_services')
            .select('service_id')
            .in('service_id', serviceIds);
          apsRows = aps2 || [];
        }

        const countsById = new Map<string, number>();
        apsRows.forEach(r => countsById.set(r.service_id, (countsById.get(r.service_id) || 0) + 1));

        const idToName = new Map((srv || []).map(s => [s.id, s.name || 'Servicio']));
        const ordered = [...countsById.entries()]
          .map(([id, count]) => ({ name: idToName.get(id) || 'Servicio', count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopServices(ordered);

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error cargando métricas');
        setLoading(false);
      }
    })();
  }, []);

  // Cálculos rápidos
  const totalClients = clients.length;
  const activeServices = services.filter(s => (s as any).is_active !== false).length; // si no hay flag, cuenta todos
  const monthCount = monthAppointments.length;
  const weekCount = monthAppointments.filter(a => a.date >= weekAgoStr).length;
  const dayCount = monthAppointments.filter(a => a.date === todayStr).length;

  // Mapa cliente->nombre para próximas
  const clientName = (id: string) => {
    const c = clients.find(x => x.id === id);
    return c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Cliente' : 'Cliente';
  };

  // Saludo (prioriza titular de empresa → usuario → correo)
  const greetingName = (() => {
    const raw = (ownerName || userName || (userEmail.split('@')[0] ?? 'Administrador')).trim();
    return toTitleWords(raw);
  })();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="h4" fontWeight={800}>
          Bienvenido, {greetingName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {companyName ? `Resumen de ${companyName}` : 'Resumen'}
        </Typography>
      </Box>

      {/* Tarjetas de KPI */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        <StatCard
          title="Clientes registrados"
          value={totalClients}
          icon={<PeopleAltOutlined />}
          color="#1e88e5"
        />
        <StatCard
          title="Servicios activos"
          value={activeServices}
          icon={<BuildOutlined />}
          color="#43a047"
        />
        <StatCard
          title="Citas hoy"
          value={dayCount}
          icon={<TodayOutlined />}
          color="#8e24aa"
        />
        <StatCard
          title="Citas últimos 7 días"
          value={weekCount}
          icon={<EventAvailableOutlined />}
          color="#f4511e"
        />
        <StatCard
          title="Citas este mes"
          value={monthCount}
          icon={<CalendarMonthOutlined />}
          color="#3949ab"
        />
      </Box>

      {/* Dos columnas: top servicios y próximas citas */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpOutlined color="primary" />
            <Typography variant="h6" fontWeight={700}>Servicios más solicitados</Typography>
          </Box>
          {topServices.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Aún no hay datos suficientes.</Typography>
          ) : (
            <List dense>
              {topServices.map((s, idx) => (
                <ListItem key={idx} secondaryAction={<Chip size="small" label={s.count} />}>
                  <ListItemText primary={s.name} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTimeOutlined color="primary" />
            <Typography variant="h6" fontWeight={700}>Próximas citas</Typography>
          </Box>
          {upcoming.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hay citas próximas.</Typography>
          ) : (
            <List dense>
              {upcoming.map((a) => {
                const when = `${dayjs(a.date).format('DD/MM/YYYY')} ${a.time.slice(0, 5)}`;
                return (
                  <Box key={a.id}>
                    <ListItem
                      secondaryAction={
                        <Chip
                          size="small"
                          color={a.status === 'aceptada' ? 'success' : 'default'}
                          label={a.status}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      }
                    >
                      <ListItemText
                        primary={clientName(a.client_id)}
                        secondary={`${when} • ${a.phone || ''}`}
                      />
                    </ListItem>
                    <Divider />
                  </Box>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

/* -------- Componentito para KPIs -------- */
function StatCard({
  title, value, icon, color,
}: { title: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: 1, bgcolor: `${color}20`, color,
          display: 'grid', placeItems: 'center'
        }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      </Box>
      <Typography variant="h4" fontWeight={800}>{value}</Typography>
    </Paper>
  );
}
