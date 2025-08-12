import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from "../components/lib/supabaseClient";
import React from 'react';

export default function ProtectedRoute({ children }: React.PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false); 

      const userId = session.user.id;

      const { data: companyUser, error } = await supabase
        .from('company_users')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !companyUser) {
        setIsAllowed(false);
      } else {
        setIsAllowed(companyUser.role === 'admin' || companyUser.role === 'empresa' || companyUser.role === 'superadmin');
      }

      setLoading(false);
    };

    verifyAccess();
  }, []);

  if (loading) return null;

  return isAllowed ? <>{children}</> : <Navigate to="/login-cliente" />;
}
