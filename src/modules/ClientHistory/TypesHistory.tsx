export interface ClientHistory {
    id: string; // obligatorio para DataGrid
    nombre: string;
    telefono: string;
    citasPasadas: number;
    servicios: string[];
    alertaSalud: boolean;
    detalleAlerta?: string; // Ejemplo: "Alergia a acetona"

  }
  