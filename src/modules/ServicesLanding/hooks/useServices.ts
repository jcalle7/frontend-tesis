import { useEffect, useState } from 'react';
import { supabase } from '../../../components/lib/supabaseClient.ts';

export interface ServiceData {
  id: number;
  nombre: string;
  precio: string;
  duracion: string;
  descripcion: string;
  imagen?: string;
}

interface ServiceRow {
  id: number;
  name: string;
  price: number  |  string; 
  duration_minutes: number  |  string; 
  description: string  |  null;
  image_url?: string;
}

function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

export function useServices() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      setError('No autenticado');
      return;
    }

    const { data: companyData } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.user.id)
      .single();

    if (!companyData?.company_id) {
      setError('Empresa no encontrada');
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', companyData.company_id);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setServices(
        (data as ServiceRow[]).map((s) => ({
          id: s.id,
          nombre: s.name,
          precio: s.price.toString() ?? '',
          duracion: s.duration_minutes.toString() ?? '',
          descripcion: s.description ?? '',
          imagen: s.image_url || '',
        }))
      );
    }

    setLoading(false);
  };

  const createOrUpdateService = async (formData: Omit<ServiceData, 'id'>, editingId?: number) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) throw new Error('No autenticado');

    const { data: companyData } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.user.id)
      .single();

    if (!companyData?.company_id) throw new Error('Empresa no encontrada');

    let image_url = formData.imagen;
    if (formData.imagen?.startsWith('data:')) {
      const fileName = `servicios/${Date.now()}.jpg`;
      const { data: _data, error } = await supabase.storage.from('imagenes').upload(fileName, dataURItoBlob(formData.imagen));
      if (error) {
        console.error('Error subiendo imagen:', error.message, error);
      throw new Error('Error subiendo imagen');
    }
      const { data: publicUrlData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
      image_url = publicUrlData?.publicUrl ?? '';
    }

    if (editingId) {
      const { error } = await supabase
        .from('services')
        .update({
          name: formData.nombre,
          price: parseFloat(formData.precio),
          duration_minutes: parseInt(formData.duracion),
          description: formData.descripcion ?? '',
          image_url,
        })
        .eq('id', editingId);

      if (error) throw new Error('Error actualizando servicio');
    } else {
      const { error } = await supabase.from('services').insert([{
        name: formData.nombre,
        price: parseFloat(formData.precio),
        duration_minutes: parseInt(formData.duracion),
        description: formData.descripcion ?? '',
        image_url,
        company_id: companyData.company_id,
      }]);

      if (error) throw new Error('Error creando servicio');
    }

    await fetchServices();
  };

  const deleteService = async (id: number) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error('Error eliminando servicio');
    setServices(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices,
    createOrUpdateService,
    deleteService,
  };
}
