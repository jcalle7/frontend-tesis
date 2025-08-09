export type EstadoCita = 'pendiente' | 'aceptada' | 'cancelada';

export interface AppointmentData {
  id: string;
  nombre: string;
  estado: EstadoCita;
  fecha: string;
  hora: string;
  telefono?: string; // necesario para WhatsApp
  clientId: string;
  comprobante?: string | null;
}
