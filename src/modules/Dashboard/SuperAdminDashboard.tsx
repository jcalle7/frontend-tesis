import { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Chip, List, ListItem, ListItemText,
  Divider, CircularProgress, Alert
} from '@mui/material';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import NewReleasesOutlined from '@mui/icons-material/NewReleasesOutlined';
import dayjs from 'dayjs';
import { supabase } from '../../components/lib/supabaseClient';

type Company = { id: string; name?: string; created_at?: string };
type Appointment = { id: string; company_id: string; date: string; time: string; status: string };

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('Superadmin');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [clientsCount, setClientsCount] = useState<number>(0);
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);

  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const first = (user.user_metadata?.first_name as string) || '';
          const last = (user.user_metadata?.last_name as string) || '';
          const full = (user.user_metadata?.name as string) || `${first} ${last}`.trim();
          setAdminName(full || user.email?.split('@')[0] || 'Superadmin');
        }

        // Empresas
        const { data: comp } = await supabase
          .from('companies')
          .select('id, name, created_at')
          .order('created_at', { ascending: false });
        setCompanies(comp || []);

        // Usuarios (distinct user_id en company_users)
        const { data: cu } = await supabase
          .from('company_users')
          .select('user_id');
        const distinctUsers = new Set((cu || []).map((r: any) => r.user_id));
        setUsersCount(distinctUsers.size);

        // Clientes (conteo global)
        const { data: cl } = await supabase
          .from('clients')
          .select('id');
        setClientsCount((cl || []).length);

        // Citas del mes (pendiente/aceptada)
        const { data: appts } = await supabase
          .from('appointments')
          .select('id, company_id, date, time, status')
          .in('status', ['pendiente', 'aceptada'])
          .gte('date', monthStart)
          .lte('date', monthEnd);
        setMonthAppointments(appts || []);

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error cargando métricas');
        setLoading(false);
      }
    })();
  }, []);

  // Top empresas por citas del mes
  const topCompanies = useMemo(() => {
    const map = new Map<string, number>();
    monthAppointments.forEach(a => {
      map.set(a.company_id, (map.get(a.company_id) || 0) + 1);
    });
    const byCount = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    // id -> name
    const nameById = new Map(companies.map(c => [c.id, c.name || 'Empresa']));
    return byCount.map(([cid, count]) => ({ name: nameById.get(cid) || cid, count }));
  }, [monthAppointments, companies]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h4" fontWeight={800}>
          Bienvenido, {adminName.split(' ')[0] || 'Superadmin'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resumen global del sistema
        </Typography>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard title="Empresas registradas" value={companies.length} icon={<BusinessOutlined />} color="#1e88e5" />
        <StatCard title="Usuarios creados" value={usersCount} icon={<PeopleAltOutlined />} color="#8e24aa" />
        <StatCard title="Clientes totales" value={clientsCount} icon={<GroupOutlined />} color="#43a047" />
        <StatCard title="Citas este mes" value={monthAppointments.length} icon={<CalendarMonthOutlined />} color="#f4511e" />
      </Box>

      {/* Listas */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpOutlined color="primary" />
            <Typography variant="h6" fontWeight={700}>Top empresas por citas (mes)</Typography>
          </Box>
          {topCompanies.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Aún no hay datos suficientes.</Typography>
          ) : (
            <List dense>
              {topCompanies.map((t, idx) => (
                <ListItem key={idx} secondaryAction={<Chip size="small" label={t.count} />}>
                  <ListItemText primary={t.name} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <NewReleasesOutlined color="primary" />
            <Typography variant="h6" fontWeight={700}>Empresas recientes</Typography>
          </Box>
          {companies.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sin registros.</Typography>
          ) : (
            <List dense>
              {companies.slice(0, 5).map(c => (
                <Box key={c.id}>
                  <ListItem>
                    <ListItemText
                      primary={c.name || 'Empresa'}
                      secondary={c.created_at ? dayjs(c.created_at).format('DD/MM/YYYY HH:mm') : ''}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

function StatCard({
  title, value, icon, color,
}: { title: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: `${color}20`, color, display: 'grid', placeItems: 'center' }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      </Box>
      <Typography variant="h4" fontWeight={800}>{value}</Typography>
    </Paper>
  );
}
