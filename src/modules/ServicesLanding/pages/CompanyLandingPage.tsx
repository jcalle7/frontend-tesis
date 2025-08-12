import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient'; 
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { Phone, Email, LocationOn } from '@mui/icons-material';
import ServiceCardFlip from '../../ServicesLanding/componentsLanding/ServiceCardFlip';
import '../../../modules/ServicesLanding/pages/landingStyles/landingStyles.css';
import Cart from '../componentsLanding/Cart';
import Navbar from '../../ServicesLanding/componentsLanding/Navbar';
import AppointmentModal from '../../ServicesLanding/componentsLanding/AppointmentModal';
import dayjs from 'dayjs';
import type { Dispatch, SetStateAction } from 'react';
import Footer from '../../ServicesLanding/componentsLanding/Footer';

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
  cedula?: string;
  id_number?: string;
  whatsapp_number?: string;
  whatsapp_url?: string;
  map_url?: string;
  company_id?: string;
  extras_note?: string;
};

type ServicioLanding = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  image_url?: string;
  company_id?: string;
  extras_note?: string;
};

export default function CompanyLandingPage() {
  const { slug } = useParams();
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [landingData, setLandingData] = useState<LandingData | null>(null);
  const [servicios, setServicios] = useState<ServicioLanding[]>([]);
  const [selectedServicios, setSelectedServicios] = useState<ServicioLanding[]>([]);
  const [carrito, setCarrito] = useState<ServicioLanding[]>([]);
  const [userName, setUserName] = useState('');     // mostramos solo cuando authReady=true
  const [authReady, setAuthReady] = useState(false); 
  const [showAllServices, setShowAllServices] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showEmptyCart, setShowEmptyCart] = useState(false);
  const [showAgendar, setShowAgendar] = useState(false);
  const [companyId, setCompanyId] = useState('');

  const serviciosMostrados = showAllServices ? servicios : servicios.slice(0, 4);

  // ---------- helpers ----------
  const guessNamesFromAuth = (user: any) => {
    const metaFull = (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '').trim();
    let first_name = (user?.user_metadata?.given_name ?? '').trim();
    let last_name = (user?.user_metadata?.family_name ?? '').trim();

    if ((!first_name || !last_name) && metaFull) {
      const parts = metaFull.split(/\s+/);
      if (!first_name) first_name = parts.shift() || '';
      if (!last_name) last_name = parts.join(' ');
    }
    if (!first_name || !last_name) {
      const local = (user?.email || '').split('@')[0];
      if (!first_name) first_name = local || 'Usuario';
      if (!last_name) last_name = 'App';
    }
    return { first_name, last_name };
  };

  // ---------- 0) esperar hidratación de sesión ----------
  useEffect(() => {
    let stop = false;
    supabase.auth.getSession().then(() => {
      if (!stop) setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt) => {
      if (!stop) setAuthReady(true);
    });
    return () => {
      stop = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---------- 1) nombre/avatar (corrige “Cliente Landing”) ----------
  useEffect(() => {
    if (!authReady) return;

    const loadDisplayName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUserName('Cliente'); return; }

      const names = guessNamesFromAuth(user);

      if (companyId) {
        const { data: cli } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();

        if (cli?.id) {
          const isPlaceholder =
            !cli.first_name || !cli.last_name ||
            (cli.first_name === 'Cliente' && cli.last_name === 'Landing');

          if (isPlaceholder) {
            await supabase
              .from('clients')
              .update({ first_name: names.first_name, last_name: names.last_name })
              .eq('id', cli.id);
            setUserName(`${names.first_name} ${names.last_name}`.trim());
          } else {
            setUserName(`${cli.first_name} ${cli.last_name}`.trim());
          }
          return;
        }
      }

      setUserName(`${names.first_name} ${names.last_name}`.trim());
    };

    loadDisplayName();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadDisplayName());
    return () => sub.subscription.unsubscribe();
  }, [authReady, companyId]);

  // ---------- 2) asegurar/crear client enlazado ----------
  const ensureClientId = async (companyIdParam: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: cli } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .eq('company_id', companyIdParam)
      .maybeSingle();

    const names = guessNamesFromAuth(user);

    if (cli?.id) {
      const placeholder =
        !cli.first_name || !cli.last_name ||
        (cli.first_name === 'Cliente' && cli.last_name === 'Landing');

      if (placeholder) {
        await supabase
          .from('clients')
          .update({ first_name: names.first_name, last_name: names.last_name })
          .eq('id', cli.id);
      }

      setUserName(`${cli.first_name || names.first_name} ${cli.last_name || names.last_name}`.trim());
      return cli.id;
    }

    const { data: created, error: createErr } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        company_id: companyIdParam,
        first_name: names.first_name,
        last_name: names.last_name,
      })
      .select('id')
      .single();

    if (createErr) {
      console.error('No se pudo crear el cliente', createErr);
      return null;
    }

    setUserName(`${names.first_name} ${names.last_name}`.trim());
    return created.id;
  };

  // cuando ya hay empresa + sesión lista, garantizamos client
  useEffect(() => {
    (async () => {
      if (!authReady || !companyId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await ensureClientId(companyId);
    })();
  }, [authReady, companyId]);

  // ---------- 3) agendar (SIN CAMBIOS FUNCIONALES) ----------
  const handleAgendarTurno = async (fechaISO: string, comprobante: File | null) => {
    try {
      console.log('[AGENDAR] start', { fechaISO, selectedServicios, companyId, hasFile: !!comprobante });

      if (!selectedServicios.length || !fechaISO || !comprobante) {
        alert('Selecciona al menos un servicio, un horario y sube el comprobante.');
        return;
      }
      if (!companyId) { alert('No se pudo identificar la empresa.'); return; }

      const client_id = await ensureClientId(companyId);
      console.log('[AGENDAR] ensureClientId =>', client_id);
      if (!client_id) return;

      const rand = (crypto as any)?.randomUUID?.() ?? `${Date.now()}`;
      const filePath = `comprobantes/${companyId}/${rand}_${comprobante.name}`;
      const up = await supabase.storage.from('imagenes').upload(filePath, comprobante, { upsert: false, contentType: comprobante.type });
      console.log('[AGENDAR] upload =>', up);
      if (up.error) { console.error('[AGENDAR] upload error', up.error); alert('No se pudo subir el comprobante.'); return; }
      const { data: pub } = supabase.storage.from('imagenes').getPublicUrl(filePath);
      const receiptUrl = pub.publicUrl;
      console.log('[AGENDAR] receiptUrl =>', receiptUrl);

      const dt = dayjs(fechaISO);
      const rpc1 = await supabase.rpc('insertar_cita_cliente', {
        p_company_id: companyId,
        p_date: dt.format('YYYY-MM-DD'),
        p_time: dt.format('HH:mm:ss'),
        p_phone: landingData?.phone ?? '',
        p_comprobante_url: receiptUrl,
        p_client_id: client_id,
      });
      console.log('[AGENDAR] insertar_cita_cliente =>', rpc1);
      if (rpc1.error || !rpc1.data) { console.error('[AGENDAR] rpc cita error', rpc1.error); alert('Error al agendar la cita.'); return; }

      const citaIdRaw = rpc1.data;
      const citaUuid = Array.isArray(citaIdRaw) ? (citaIdRaw[0]?.id ?? citaIdRaw[0]) : (citaIdRaw?.id ?? citaIdRaw);
      console.log('[AGENDAR] citaUuid =>', citaUuid);

      const serviceIds = selectedServicios
        .map(s => (typeof s?.id === 'object' ? s?.id?.id : s?.id))
        .filter((id): id is string => typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id));
      console.log('[AGENDAR] serviceIds =>', serviceIds);

      const rpc2 = await supabase.rpc('insertar_servicios_de_cita', {
        p_appointment_id: citaUuid,
        p_service_ids: serviceIds,
      });
      console.log('[AGENDAR] insertar_servicios_de_cita =>', rpc2);
      if (rpc2.error) { console.error('[AGENDAR] rpc servicios error', rpc2.error); alert('La cita se creó pero falló al asociar los servicios.'); return; }

      alert('✅ Cita agendada con éxito. Espera confirmación.');
      setSelectedServicios([]); setCarrito([]); setShowAgendar(false);
    } catch (e) {
      console.error('[AGENDAR] catch', e);
      alert('Ocurrió un error al agendar.');
    }
  };

  // ---------- 4) links ----------
  const waLink =
    landingData?.whatsapp_url ||
    (landingData?.whatsapp_number
      ? `https://wa.me/${landingData.whatsapp_number.replace(/\D/g, '')}`
      : undefined);

  const mapSrc =
    landingData?.map_url ||
    (landingData?.address
      ? `https://www.google.com/maps?q=${encodeURIComponent(landingData.address)}&output=embed`
      : undefined);

  // ---------- 5) fetch landing/servicios (espera authReady) ----------
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const fetchLanding = async () => {
      try {
        if (!slug || cancelled) return;

        console.log('[Landing] slug =>', slug);

        // empresa por slug
        const { data: company, error: compErr } = await supabase
          .from('companies')
          .select('id, name, slug')
          .eq('slug', slug)
          .maybeSingle();

        if (cancelled) return;

        if (compErr || !company) {
          console.warn('[Landing] No se encontró empresa para ese slug', compErr);
          setEmpresaNombre('');
          setLandingData(null);
          setServicios([]);
          return;
        }

        setEmpresaNombre(company.name ?? '');
        setCompanyId(company.id);

        // landing
        const { data: landing, error: landErr } = await supabase
          .from('landing_data')
          .select(`
            cover_url, title, bank_account, phone, email, address,
            facebook_url, instagram_url, tiktok_url,
            whatsapp_number, whatsapp_url, map_url, cedula, company_id
          `)
          .eq('company_id', company.id)
          .maybeSingle();

        if (!cancelled) {
          if (landErr) console.error('[Landing] error landing_data:', landErr);
          setLandingData(landing ?? { company_id: company.id });
        }

        // servicios
        const { data: svcs, error: svcErr } = await supabase
          .from('services')
          .select('id, name, description, price, duration_minutes, image_url, company_id, is_active, extras_note')
          .eq('company_id', company.id)
          .order('name');

        if (!cancelled) {
          if (svcErr) {
            console.error('[Landing] error servicios:', svcErr);
            setServicios([]);
          } else {
            setServicios(svcs ?? []);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[Landing] error general:', e);
          setServicios([]);
        }
      }
    };

    fetchLanding();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) fetchLanding();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [slug, authReady]);

  
    const handleCartClick = () => {
      if (!carrito || carrito.length === 0) {
        setShowEmptyCart(true);
      } else {
        setShowCart(true); 
      }
    };

    const setShowCartProxy: Dispatch<SetStateAction<boolean>> = (updater) => {
    if (!carrito || carrito.length === 0) {
    setShowEmptyCart(true);              
    return;
    }

    if (typeof updater === 'function') {
    setShowCart((prev) => (updater as (prev: boolean) => boolean)(prev));
    } else {
    setShowCart(updater);
    }
  };

  const openCart = () => {
  if (!carrito || carrito.length === 0) {
    setShowEmptyCart(true);   // modal de vacío
  } else {
    setShowCart(true);        // abre carrito
  }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen">
      <Navbar
        userName={authReady ? (userName || 'Cliente') : ''} // evita "CL" antes de tiempo
        companyName={empresaNombre || 'Nombre empresa'}
        carrito={carrito}
        onCartClick={openCart}
      />

      {landingData?.cover_url && (
      <div className="hero-bleed">
      <div className="hero">
      <img
        className="hero-img"
        src={landingData.cover_url}
        alt={landingData?.title || empresaNombre}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>{landingData?.title || `Bienvenidos a ${empresaNombre}`}</h1>
      </div>
      </div>
    </div>
  )}

      <section id="servicios" className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center mb-10">Nuestros servicios</h2>
        <div className="services-grid gap-6 md:gap-8">
          {serviciosMostrados.map((s) => {
            const isSelected = selectedServicios.some((sel) => sel.id === s.id);
            return (
              <ServiceCardFlip
                key={s.id}
                name={s.name ?? 'Sin nombre'}
                description={s.description ?? 'Sin descripción'}
                price={s.price ?? 0}
                duration={s.duration_minutes ?? 0}
                image={s.image_url ?? 'https://via.placeholder.com/300x200?text=Sin+imagen'}
                extrasNote={s.extras_note ?? ''}   // <- NUEVO
                onClick={() => {
                  setSelectedServicios(
                    isSelected
                      ? selectedServicios.filter((item) => item.id !== s.id)
                      : [...selectedServicios, s]
                  );
                }}
                onAddToCart={() => setCarrito((prev) => [...prev, s])}
                selected={isSelected}
              />
            );
          })}
        </div>
      </section>

      {servicios.length > 4 && (
        <div className="cta-row">
        <button onClick={() => setShowAllServices(v => !v)} className="btn-cta btn-cta--soft-rose">
        {showAllServices ? 'Ver menos servicios' : 'Ver más servicios'}
        </button>
        </div>
      )} 

      <AppointmentModal
        open={showAgendar}
        onClose={() => {
          setShowAgendar(false);
          setSelectedServicios([]);
        }}
        onConfirm={handleAgendarTurno}
        selectedServices={selectedServicios}
        bankAccount={landingData?.bank_account ?? ''}
        idNumber={landingData?.cedula ?? landingData?.id_number ?? ''}
        companyId={companyId}
      />

      {(landingData?.phone || landingData?.email || landingData?.address) && (
        <section id="contacto" className="band band-contact">
        <div className="band-inner">
          <h3 className="section-title">Contáctanos</h3>

        <ul className="contact-list">
        {landingData?.phone && (
          <li className="contact-item">
            <span className="contact-icon"><Phone fontSize="small" /></span>
            <span className="contact-value">{landingData.phone}</span>
          </li>
        )}
        {landingData?.email && (
          <li className="contact-item">
            <span className="contact-icon"><Email fontSize="small" /></span>
            <span className="contact-value">{landingData.email}</span>
          </li>
        )}
        {landingData?.address && (
          <li className="contact-item">
            <span className="contact-icon"><LocationOn fontSize="small" /></span>
            <span className="contact-value">{landingData.address}</span>
          </li>
        )}
        </ul>
      </div>
    </section>
    )}

     {mapSrc && (
       <section id="ubicacion" className="band band-location">
         <div className="band-inner">
           <h3 className="section-title">¿Dónde estamos?</h3>

           <div className="map-card">
             <iframe
               title="Ubicación"
               src={mapSrc}
               width="100%"
               height="100%"
               style={{ border: 0 }}
               loading="lazy"
               allowFullScreen
               referrerPolicy="no-referrer-when-downgrade"
             />
           </div>
         </div>
       </section>
     )}


{(landingData?.facebook_url || landingData?.instagram_url || landingData?.tiktok_url || waLink) && (
  <section className="band band-social">
    <div className="band-inner">
      <h3 className="section-title">Síguenos en redes</h3>

      <div className="social-row">
        {landingData?.facebook_url && (
          <a className="social-btn fb" href={landingData.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FaFacebook />
          </a>
        )}
        {landingData?.instagram_url && (
          <a className="social-btn ig" href={landingData.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaInstagram />
          </a>
        )}
        {landingData?.tiktok_url && (
          <a className="social-btn tk" href={landingData.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <FaTiktok />
          </a>
        )}
        {waLink && (
          <a className="social-btn wa" href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <FaWhatsapp />
          </a>
        )}
      </div>
    </div>
  </section>
)}


{showCart && (
  <Cart
    open={showCart}                                
    onClose={() => setShowCart(false)}             
    carrito={carrito}
    setCarrito={setCarrito}
    onPagar={() => {
      setShowCart(false);
      setShowAgendar(true);
      setSelectedServicios([...carrito]);
    }}
  />
)}

      {/* Modal carrito vacío */}
{showEmptyCart && (
  <div
    onClick={() => setShowEmptyCart(false)}
    style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
      display:'grid', placeItems:'center', zIndex:1300
    }}
  >
    <div
      onClick={(e)=>e.stopPropagation()}
      style={{
        width: 'min(92vw, 420px)', borderRadius: 16, padding: 20,
        background:'#fff', boxShadow:'0 20px 50px rgba(0,0,0,.25)', textAlign:'center'
      }}
    >
      <h4 style={{margin:'0 0 6px', fontSize: '1.25rem', fontWeight: 800}}>Tu carrito está vacío</h4>
      <p style={{margin:'0 0 16px', color:'#475569'}}>Aún no has añadido servicios.</p>
      <button onClick={()=>setShowEmptyCart(false)} className="btn-cta btn-cta--soft-rose">
        Entendido
      </button>
    </div>
  </div>
)}
<Footer  companyId={companyId} companyName={empresaNombre} landing={landingData} />
</div>
);
}
