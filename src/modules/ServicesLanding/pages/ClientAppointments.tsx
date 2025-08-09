import { useEffect, useState } from 'react';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import {
  Container, Typography, Card, CardContent,
  Grid, Chip, CircularProgress
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import dayjs from 'dayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

interface Servicio {
  name: string;
  price?: number;
  duration_minutes?: number;
}

interface Cita {
  id: string;
  date: string;
  time: string;
  status: string;
  servicios: Servicio[];
}

export default function ClientsAppointments() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [slugEmpresa, setSlugEmpresa] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCitasDelCliente = async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData?.user) {
        console.error('No autenticado:', authError);
        return;
      }

      const userEmail = userData.user.email;

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, company_id')
        .eq('email', userEmail)
        .maybeSingle();

      if (clientError || !client || !client.company_id) {
        console.error('Cliente no encontrado o company_id faltante:', clientError, client);
        return;
      }

    const { data: empresa, error: empresaError } = await supabase
        .from('companies')
        .select('slug')
        .eq('id', client.company_id)
        .maybeSingle();

      if (empresaError || !empresa) {
        console.error('Error obteniendo empresa:', empresaError);
        return;
      }

      setSlugEmpresa(empresa.slug);

      const { data: citasData, error: citasError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: false });

      if (citasError) {
        console.error('Error al obtener citas:', citasError);
        return;
      }

      const citasConServicios: Cita[] = [];

      for (const cita of citasData) {
        const { data: serviciosRelacionados, error: relError } = await supabase
          .from('appointment_services')
          .select('service_id')
          .eq('appointment_id', cita.id);

        if (relError) {
          console.error('Error obteniendo relación servicios:', relError);
          continue;
        }

        const servicioIds = serviciosRelacionados?.map((s) => s.service_id) || [];

        const { data: servicios, error: serviciosError } = await supabase
          .from('services')
          .select('name, price, duration_minutes')
          .in('id', servicioIds);

        if (serviciosError) {
          console.error('Error obteniendo servicios:', serviciosError);
          continue;
        }

        citasConServicios.push({
          id: cita.id,
          date: cita.date,
          time: cita.time,
          status: cita.status,
          servicios: servicios ?? [],
        });
      }

      setCitas(citasConServicios);
      setLoading(false);
    };

    fetchCitasDelCliente();
  }, []);

return (
  <Container maxWidth="md" sx={{ pt: 5 }}>
    <Typography variant="h4" gutterBottom fontWeight="bold">
      Mis citas
    </Typography>

    {loading ? (
      <CircularProgress />
    ) : citas.length === 0 ? (
      <Typography variant="body1">No tienes citas agendadas aún.</Typography>
    ) : (
      <Grid container spacing={3}>
        {citas.map((cita) => {
          const chipColor: ChipProps['color'] =
            cita.status === 'pendiente'
              ? 'warning'
              : cita.status === 'confirmado'
              ? 'success'
              : 'default';

          return (
            <Grid item xs={12} key={cita.id}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6">
                    Cita del {dayjs(cita.date).format('DD/MM/YYYY')} a las {cita.time}
                  </Typography>

                  <Typography fontSize={14} color="text.secondary" mt={1}>
                    Servicios:
                  </Typography>

                  <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                    {cita.servicios.map((s, index) => (
                      <li key={index}>
                        {`${s.name} — $${s.price ?? 0} | ${s.duration_minutes ?? ''} min`}
                      </li>
                    ))}
                  </ul>

                  <Chip label={cita.status.toUpperCase()} color={chipColor} size="small" sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    )}

    <button
      onClick={() => navigate(`/empresa/${slugEmpresa}`)}
      style={{
        backgroundColor: '#9C27B0',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        marginBottom: '2rem',
        cursor: 'pointer',
      }}
    >
      <ArrowBackIcon style={{ fontSize: 20 }} />
      REGRESAR
    </button>
  </Container>
);
}

