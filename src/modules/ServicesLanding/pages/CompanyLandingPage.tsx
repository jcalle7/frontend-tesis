import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';
import { Phone, Email, LocationOn } from '@mui/icons-material';
import ServiceCardFlip from '../../ServicesLanding/componentsLanding/ServiceCardFlip';
import '../../../modules/ServicesLanding/pages/landingStyles/landingStyles.css';
import Cart from '../componentsLanding/Cart'
import Navbar from '../../ServicesLanding/componentsLanding/Navbar'; 
import AppointmentModal from '../../ServicesLanding/componentsLanding/AppointmentModal';

type LandingData = {
  cover_url?: string;
  title?: string;
  bank_account?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
};

type ServicioLanding = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  image_url?: string;
  company_id?: string;
};

export default function CompanyLandingPage() {
  const { slug } = useParams();
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [landingData, setLandingData] = useState<LandingData | null>(null);
  const [servicios, setServicios] = useState<ServicioLanding[]>([]);
  const [selectedServicios, setSelectedServicios] = useState<ServicioLanding[]>([]);
  const [carrito, setCarrito] = useState<ServicioLanding[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showAgendar, setShowAgendar] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');


  useEffect(() => {
  const fetchLoggedUserName = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error('Usuario no autenticado o error:', userError);
      return;
    }

    // Buscar en tu tabla personalizada de usuarios/clientes
    const { data: clientData, error: clientError } = await supabase
      .from('clients') // cambia según tu tabla real
      .select('first_name, last_name, user_id, id' )
      .eq('user_id', userData.user.id)
      .maybeSingle();

console.log('Cliente encontrado:', clientData, 'Error:', clientError);

    if (clientError || !clientData) {
      console.error('Error al obtener datos del cliente:', clientError);
      return;
    }

    const fullName = `${clientData.first_name} ${clientData.last_name}`;
    setUserName(fullName);
  };

  fetchLoggedUserName();
}, []);

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

      const companyId = empresa.id;
      const { data: staffRow } = await supabase
      .from('staff')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

      // guarda en estado
      setCompanyId(companyId);
      setStaffId(staffRow?.id ?? '');

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

        if (serviciosError) console.error('Error al obtener servicios:', serviciosError);

      setServicios(serviciosData || []);
    };
    fetchLanding();
  }, [slug]);

const handleAgendarTurno = async (fecha: string, comprobante: File | null) => {
  if (!selectedServicios || selectedServicios.length === 0 || !fecha || !comprobante) {
    alert('Completa todos los campos.');
    return;
  }

  // 1. Obtener el usuario autenticado
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    alert('Error al obtener el usuario autenticado.');
    return;
  }

  // 2. Obtener el client_id desde la tabla clients usando user_id
const { data: clientRow, error: clientError } = await supabase
  .from('clients')
  .select('id')
  .eq('user_id', userData.user.id)
  .maybeSingle();

if (clientError || !clientRow) {
  alert('Error al obtener el ID del cliente.');
  return;
}

const clientId = clientRow.id;
console.log("clientId que se insertará:", clientId);

  // 3. Subir comprobante al bucket correcto
  const fileName = `comprobantes/${Date.now()}_${comprobante.name}`;
  const { error: uploadError } = await supabase
    .storage.from('imagenes') // <-- Tu bucket real
    .upload(fileName, comprobante);

  if (uploadError) {
    alert('Error al subir el comprobante.');
    return;
  }

  // 4. Obtener URL pública del comprobante
  const { publicUrl } = supabase.storage.from('imagenes').getPublicUrl(fileName).data;

  // 5. Insertar en appointments (usa solo columnas existentes)
const dateObject = new Date(fecha);
const hora = dateObject.toTimeString().split(' ')[0]; // HH:mm:ss

const { data: citaId, error: rpcError } = await supabase.rpc('insertar_cita_cliente', {
  p_company_id: selectedServicios[0]?.company_id,
  p_date: fecha.split('T')[0],
  p_time: hora,
  p_phone: landingData?.phone ?? '',
  p_comprobante_url: publicUrl,
  p_client_id: clientId
});

if (rpcError || !citaId) {
  console.error("Error RPC:", rpcError);
  alert("Error al agendar la cita.");
  return;
}

  // 6. Insertar en appointment_services
const serviceIds: string[] = selectedServicios.map((s) => {
  const maybeId = typeof s?.id === 'object' ? s?.id?.id : s?.id;
  return typeof maybeId === 'string' ? maybeId : '';
}).filter((id) => /^[0-9a-fA-F-]{36}$/.test(id));

// Extraer el ID real de la cita
const citaUuid = Array.isArray(citaId) && citaId.length > 0
  ? citaId[0].id
  : citaId;

// Llama a Supabase
console.log("citaId que devuelve insertar_cita_cliente:", citaId);

const { error: serviciosError } = await supabase.rpc('insertar_servicios_de_cita_json', {
  p_appointment_id: citaUuid,
  p_service_ids: serviceIds
});


if (serviciosError) {
  console.error('Error al insertar servicios:', serviciosError);
  alert('Error al registrar los servicios de la cita.');
  return;
}

  // 7. Finalizar
  alert('Cita agendada con éxito. Espera confirmación.');
  setSelectedServicios([]);
  setCarrito([]);
  setShowAgendar(false);
};

  return (
    <div className="min-h-screen">
      <Navbar userName={userName || 'Cliente'} companyName={empresaNombre || 'Nombre empresa'}   carrito={carrito}
  setShowCart={setShowCart} />

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
          const isSelected = selectedServicios.some((sel) => sel.id === s.id);
          console.log('Renderizando servicio:', s.name);
          return (
          <ServiceCardFlip
            key={s.id}
            name={s.name ?? 'Sin nombre'}
            description={s.description ?? 'Sin descripción'}
            price={s.price ?? 0}
            duration={s.duration_minutes ?? 0}
            image={s.image_url ?? 'https://via.placeholder.com/300x200?text=Sin+imagen'}
            onClick={() => {
              if (isSelected) {
                  setSelectedServicios(selectedServicios.filter((item) => item.id !== s.id));
              } else {
                  setSelectedServicios([...selectedServicios, s]);
              }
            }}
            onAddToCart={() => {
              setCarrito((prev) => {
              const nuevo = [...prev, s];
              console.log('Nuevo carrito:', nuevo);
              return nuevo;
            });
              
            }}
            selected={isSelected}
          />
         );
      })}
      </div>
      </section>

      {/* Agendamiento */}
        <AppointmentModal
          open={showAgendar}
          onClose={() => { setShowAgendar(false); setSelectedServicios([]); }}
          onConfirm={handleAgendarTurno} // ← NO lo toco
          selectedServices={selectedServicios}
          bankAccount={landingData?.bank_account || ''}
          companyId={companyId}  
          staffId={staffId}
        />

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
      {showCart && carrito.length > 0 && (
        <Cart
          carrito={carrito}
          setCarrito={setCarrito}
          onPagar={() => {
          setShowCart(false);
          setShowAgendar(true);
          setSelectedServicios([...carrito]); 
        }}
      />
    )}
    </div>
  );
}
