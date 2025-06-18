import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from "../components/lib/supabaseClient.ts";
import React from 'react';

export default function ProtectedRoute({ children }: React.PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false); // No autenticado

      const userId = session.user.id;

      // Buscar el rol del usuario en la tabla company_users
      const { data: companyUser, error } = await supabase
        .from('company_users')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !companyUser) {
        setIsAllowed(false);
      } else {
        // Solo se permite acceso si es superadmin, admin o empresa
        setIsAllowed(companyUser.role === 'admin' || companyUser.role === 'empresa' || companyUser.role === 'superadmin');
      }

      setLoading(false);
    };

    verifyAccess();
  }, []);

  if (loading) return null;

  return isAllowed ? <>{children}</> : <Navigate to="/login-cliente" />;
}
