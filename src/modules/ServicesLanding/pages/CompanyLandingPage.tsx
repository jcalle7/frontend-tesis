import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import React from "react";

type Servicio = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url: string;
};

export default function CompanyLandingPage() {
  const { slug } = useParams();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [empresaNombre, setEmpresaNombre] = useState('');

  useEffect(() => {
    const fetchServicios = async () => {
      const { data: empresa, error: empresaError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('slug', slug)
        .single();

      if (!empresa || empresaError) return;

      setEmpresaNombre(empresa.name);

      const { data: serviciosData } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', empresa.id);

      setServicios(serviciosData || []);
    };

    fetchServicios();
  }, [slug]);

  return (
    <Box p={4}>
      <Typography variant="h3" gutterBottom>
        Servicios de {empresaNombre}
      </Typography>

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
    </Box>
  );
}
