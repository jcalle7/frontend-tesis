import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../components/lib/supabaseClient';

export default function RequireClientAuth({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams(); // /empresa/:slug

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session?.user) {
        const redirect = encodeURIComponent(location.pathname);
        // 👇 tu ruta REAL de login de clientes
        navigate(`/login-cliente?slug=${slug ?? ''}&redirect=${redirect}`, { replace: true });
      }
    })();
    return () => { mounted = false; };
  }, [navigate, location.pathname, slug]);

  return children;
}
