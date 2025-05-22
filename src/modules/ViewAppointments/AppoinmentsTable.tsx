import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Button, Stack, Chip } from '@mui/material';
import { AppointmentData } from '../ViewAppointments/TypesCitas';

interface AppointmentTableProps {
  rows: AppointmentData[];
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function AppointmentTable({ rows, onAccept, onCancel }: AppointmentTableProps) {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { 
      field: 'estado', 
      headerName: 'Estado', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const color = params.value === 'Aceptada' ? 'success' : params.value === 'Pendiente' ? 'warning' : 'error';
        return <Chip label={params.value} color={color as any} />;
      },
    },
    { field: 'fecha', headerName: 'Fecha', flex: 1 },
    { field: 'hora', headerName: 'Hora', flex: 1 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 1.5,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Button color="primary" variant="contained" onClick={() => onAccept(params.row.id)}>
            ACEPTAR
          </Button>
          <Button color="error" variant="outlined" onClick={() => onCancel(params.row.id)}>
            CANCELAR
          </Button>
        </Stack>
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
      />
    </div>
  );
}
