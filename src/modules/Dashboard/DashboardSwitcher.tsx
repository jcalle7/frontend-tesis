import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { supabase } from '../../components/lib/supabaseClient';
import HomeDashboard from './HomeDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function DashboardSwitcher() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setRole((user?.user_metadata?.role as string) || null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <CircularProgress />;
  return role === 'superadmin' ? <SuperAdminDashboard /> : <HomeDashboard />;
}
