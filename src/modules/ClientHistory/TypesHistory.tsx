export interface ClientHistory {
    id: string; // obligatorio para DataGrid
    nombre: string;
    telefono: string;
    citasPasadas: number;
    servicios: string[];
    alertaSalud: boolean;
  }
  