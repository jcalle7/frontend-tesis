export interface AppointmentFormData {
    cliente: string;
    servicios: string[];
    fechaHora: string; 
  }

  export interface Cliente {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Servicio {
  id: string;
  name: string;
}