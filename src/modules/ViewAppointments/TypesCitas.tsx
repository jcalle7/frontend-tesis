export interface AppointmentData {
  id: string;
  nombre: string;
  estado: 'Aceptada' | 'Pendiente' | 'Cancelada';
  fecha: string;
  hora: string;
  telefono?: string; // necesario para WhatsApp
  clientId: string;
}
