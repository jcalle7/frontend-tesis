import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient';

export default function RedirectClientToSlugLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email;

      if (!userEmail) return navigate('/login-cliente');

      const { data: client } = await supabase
        .from('clients')
        .select('company_id')
        .eq('email', userEmail)
        .limit(1)
        .maybeSingle();

      if (!client) return navigate('/login-cliente');

      const { data: company } = await supabase
        .from('companies')
        .select('slug')
        .eq('id', client.company_id)
        .single();

      if (company?.slug) {
        navigate(`/empresa/${company.slug}`);
      } else {
        navigate('/login-cliente');
      }
    };

    fetchAndRedirect();
  }, [navigate]);

  return null;
}
