export interface AppointmentFormData {
    cliente: string;
    servicios: string[];
    fechaHora: string; 
  }

  export interface Cliente {
  id: string;
  first_name: string;
  last_name: string;
  // otros campos como teléfono, email, etc.
}

export interface Servicio {
  id: string;
  name: string;
  // se puede agregar descripción o precio si lo necesito
}