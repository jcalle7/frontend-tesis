import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';
import { Phone, Email, LocationOn } from '@mui/icons-material';
import ServiceCardFlip from '../../ServicesLanding/pages/ServiceCardFlip';
import '../../../modules/ServicesLanding/pages/landingStyles/landingStyles.css';

export default function CompanyLandingPage() {
  const { slug } = useParams();
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [landingData, setLandingData] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [fecha, setFecha] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const fetchLanding = async () => {
      const { data: empresa, error: empresaError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

      if (empresaError) console.error('Error al buscar empresa:', empresaError);
      if (!empresa) return;

      setEmpresaNombre(empresa.name);
      console.log('Empresa encontrada:', empresa);

      const { data: landing, error: landingError } = await supabase
        .from('landing_data')
        .select('*')
        .eq('company_id', empresa.id)
        .maybeSingle();
    
        if (landingError) console.error('Error en landing:', landingError);

        setLandingData(landing || null);

      const { data: serviciosData, error: serviciosError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', empresa.id);

        console.log('Servicios cargados:', serviciosData); // <- los servicios que trae
        if (serviciosError) console.error('Error al obtener servicios:', serviciosError);

      setServicios(serviciosData || []);
    };
    fetchLanding();
  }, [slug]);

  const handleAgendarTurno = async () => {
    if (!selectedServicio || !fecha || !comprobante) {
      alert('Completa todos los campos y sube el comprobante.');
      return;
    }

    const fileName = `comprobantes/${Date.now()}_${comprobante.name}`;
    const { error: uploadError } = await supabase
      .storage.from('comprobantes')
      .upload(fileName, comprobante);

    if (uploadError) {
      alert('Error al subir el comprobante.');
      return;
    }

    const { publicUrl } = supabase.storage.from('comprobantes').getPublicUrl(fileName).data;

    const { error: insertError } = await supabase.from('appointments').insert({
      service_id: selectedServicio.id,
      company_id: selectedServicio.company_id,
      date: fecha.split('T')[0],
      time: fecha.split('T')[1],
      phone: landingData?.phone ?? '',
      status: 'pendiente',
      comprobante_url: publicUrl
    });

    if (insertError) {
      alert('Error al agendar cita.');
      return;
    }

    alert('Cita agendada. Espera confirmación.');
    setSelectedServicio(null);
    setFecha('');
    setComprobante(null);
  };

  console.log('Servicios a renderizar:', servicios);
  return (
    <div className="min-h-screen">
      <nav className="bg-white px-6 py-3 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="space-x-6">
          <a href="#servicios" className="hover:text-blue-600">Servicios</a>
          <a href="#agendar" className="hover:text-blue-600">Agendar</a>
          <a href="#contacto" className="hover:text-blue-600">Contacto</a>
          <a href="#carrito" className="hover:text-blue-600">🛒 Carrito</a>
        </div>
      </nav>

      {/* Portada */}
      {landingData?.cover_url && (
        <div
          className="hero"
          style={{ backgroundImage: `url(${landingData.cover_url})` }}
        >
          <h1>{landingData?.title || `Servicios de ${empresaNombre}`}</h1>
        </div>
      )}

      {/* Servicios */}
      <section id="servicios">
        <h2 className="text-2xl font-bold mb-4">Nuestros servicios</h2>
        <div className="services-grid">
        {servicios.map((s) => {
          console.log('Renderizando servicio:', s.name);
          return (
          <ServiceCardFlip
            key={s.id}
            name={s.name ?? 'Sin nombre'}
            description={s.description ?? 'Sin descripción'}
            price={s.price ?? 0}
            duration={s.duration_minutes ?? 0}
            image={s.image_url ?? 'https://via.placeholder.com/300x200?text=Sin+imagen'}
            onClick={() => setSelectedServicio(s)}
          />
        );
      })}
        </div>
      </section>

      {/* Agendamiento */}
      {selectedServicio && (
        <section id="agendar" className="bg-gray-100 p-6 mt-8 rounded-lg shadow-md max-w-xl mx-auto">
          <h3 className="text-xl font-bold mb-2">Agendar cita para: {selectedServicio.name}</h3>
          <p className="mb-2 text-gray-600">Debes depositar el 50% del servicio a:</p>
          <p className="text-base font-medium text-blue-700 bg-blue-50 p-2 rounded">
            {landingData?.bank_account || 'Cuenta bancaria no disponible'}
          </p>

          <input
            type="datetime-local"
            className="w-full p-2 border rounded mb-4"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Comprobante de pago:</label>
            <input type="file" accept="image/*" onChange={(e) => {
              if (e.target.files?.[0]) setComprobante(e.target.files[0]);
            }} />
          </div>

          <div className="flex justify-between gap-4">
            <button
              onClick={handleAgendarTurno}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Confirmar cita
            </button>
            <button
              onClick={() => {
                setCarrito([...carrito, selectedServicio]);
                alert('Servicio añadido al carrito');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Añadir al carrito
            </button>
          </div>
        </section>
      )}

      {/* Contacto */}
      {(landingData?.phone || landingData?.email || landingData?.address) && (
        <section id="contacto">
          <h3 className="text-xl font-semibold mb-2">Contáctanos</h3>
          <div className="contact-info">
            {landingData.phone && <p><Phone fontSize="small" /> {landingData.phone}</p>}
            {landingData.email && <p><Email fontSize="small" /> {landingData.email}</p>}
            {landingData.address && <p><LocationOn fontSize="small" /> {landingData.address}</p>}
          </div>
        </section>
      )}

      {/* Redes sociales */}
      {(landingData?.facebook_url || landingData?.instagram_url || landingData?.tiktok_url) && (
        <section>
          <h3 className="text-xl font-semibold mb-2">Síguenos en redes:</h3>
          <div className="social-icons">
            {landingData.facebook_url && (
              <a href={landingData.facebook_url} target="_blank" rel="noopener noreferrer">
                <FaFacebook />
              </a>
            )}
            {landingData.instagram_url && (
              <a href={landingData.instagram_url} target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
            )}
            {landingData.tiktok_url && (
              <a href={landingData.tiktok_url} target="_blank" rel="noopener noreferrer">
                <FaTiktok />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Carrito */}
      {carrito.length > 0 && (
        <section id="carrito" className="bg-white p-6 mt-10 rounded-lg shadow-md max-w-xl mx-auto">
          <h3 className="text-xl font-bold mb-4">Carrito de compras</h3>
          <ul className="divide-y divide-gray-200">
            {carrito.map((item, index) => (
              <li key={index} className="py-2">
                {item.name} - ${item.price}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold">
            Total: ${carrito.reduce((acc, s) => acc + s.price, 0).toFixed(2)}
          </p>
        </section>
      )}
    </div>
  );
}
