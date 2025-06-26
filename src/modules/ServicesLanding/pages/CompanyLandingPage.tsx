import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Link
} from '@mui/material';

type Servicio = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url: string;
};

type LandingData = {
  cover_url: string;
  title: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
};

export default function CompanyLandingPage() {
  const { slug } = useParams();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [landingData, setLandingData] = useState<LandingData | null>(null);

  useEffect(() => {
    const fetchLanding = async () => {
      const { data: empresa } = await supabase
        .from('companies')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

      if (!empresa) return;

      setEmpresaNombre(empresa.name);

      const { data: landing } = await supabase
        .from('landing_data')
        .select('*')
        .eq('company_id', empresa.id)
        .maybeSingle();

      setLandingData(landing || null);

      const { data: serviciosData } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', empresa.id);

      setServicios(serviciosData || []);
    };

    fetchLanding();
  }, [slug]);

  return (
    <Box p={4}>
      {/* Portada */}
      {landingData?.cover_url && (
        <Box
          sx={{
            height: 300,
            backgroundImage: `url(${landingData.cover_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 2,
            mb: 4
          }}
        />
      )}

      {/* Título personalizado */}
      <Typography variant="h3" gutterBottom>
        {landingData?.title || `Servicios de ${empresaNombre}`}
      </Typography>

      {/* Servicios */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
        gap={3}
        mt={4}
      >
        {servicios.map((servicio) => (
          <Card key={servicio.id}>
            <CardMedia
              component="img"
              height="180"
              image={servicio.image_url || 'https://via.placeholder.com/300x180'}
              alt={servicio.name}
            />
            <CardContent>
              <Typography variant="h6">{servicio.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {servicio.description || 'Sin descripción'}
              </Typography>
              <Typography mt={1}><strong>Precio:</strong> ${servicio.price.toFixed(2)}</Typography>
              <Typography><strong>Duración:</strong> {servicio.duration_minutes} minutos</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Redes sociales */}
      {(landingData?.facebook_url || landingData?.instagram_url || landingData?.tiktok_url) && (
        <Box mt={5}>
          <Typography variant="h6" gutterBottom>Síguenos en redes:</Typography>
          <Box display="flex" gap={2}>
            {landingData.facebook_url && <Link href={landingData.facebook_url} target="_blank">Facebook</Link>}
            {landingData.instagram_url && <Link href={landingData.instagram_url} target="_blank">Instagram</Link>}
            {landingData.tiktok_url && <Link href={landingData.tiktok_url} target="_blank">TikTok</Link>}
          </Box>
        </Box>
      )}
    </Box>
  );
}
