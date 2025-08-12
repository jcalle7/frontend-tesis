import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from "../components/lib/supabaseClient";
import React from 'react';

export default function ClientProtectedRoute({ children }: React.PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const verifyClient = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false);

      const userEmail = session.user.email;

      const { data: client, error } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      setIsClient(!!client && !error);
      setLoading(false);
    };

    verifyClient();
  }, []);

  if (loading) return null;

  return isClient ? <>{children}</> : <Navigate to="/login-cliente" />;
}
