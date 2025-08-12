export type EstadoCita = 'pendiente' | 'aceptada' | 'cancelada' | 'terminada';

export interface AppointmentData {
  id: string;
  nombre: string;
  estado: EstadoCita;
  fecha: string;
  hora: string;
  telefono?: string; 
  clientId: string;
  comprobante?: string | null;
}
