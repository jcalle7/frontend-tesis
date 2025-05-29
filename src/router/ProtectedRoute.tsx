import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../components/lib/supabaseClient';

export default function ProtectedRoute({ children }: React.PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}
