import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Button, Chip } from '@mui/material';
import { AppointmentData } from "./TypesCitas";
import {
  actionButtonsContainerAppointments,
  acceptButtonStyleAppointments,
  cancelButtonStyleAppointments,
} from "./Styles/AppointmentTable.styles";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import React from 'react';

interface AppointmentTableProps {
  rows: AppointmentData[];
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
  onSendForm: (id: string) => void;
}

export default function AppointmentTable({ rows, onAccept, onCancel, onSendForm }: AppointmentTableProps) {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const estado = params.value?.toLowerCase();
        
        const color: 'success' | 'warning' | 'error' =
          estado === 'aceptada' ? 'success' 
          : estado === 'pendiente' ? 'warning' : 'error';

          const label = estado.charAt(0).toUpperCase() + estado.slice(1); 

        return <Chip label={params.value} color={color} />;
      },
    },
    { field: 'fecha', headerName: 'Fecha', flex: 1 },
    { field: 'hora', headerName: 'Hora', flex: 1 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <div style={actionButtonsContainerAppointments as React.CSSProperties}>
          <Button
            color="primary"
            variant="contained"
            onClick={() => onAccept(params.row.id)}
            sx={acceptButtonStyleAppointments}
            disabled={params.row.estado.toLowerCase() !== 'pendiente'}
          >
            ACEPTAR
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={() => onCancel(params.row.id)}
            sx={cancelButtonStyleAppointments}
            disabled={params.row.estado.toLowerCase() !== 'pendiente'}
          >
            CANCELAR
          </Button>
          <Button
            variant="text"
            color="success"
            onClick={() => onSendForm(params.row.id)}
            startIcon={<WhatsAppIcon />}
          >
            FORMULARIO
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
        autoHeight
      />
    </div>
  );
}
