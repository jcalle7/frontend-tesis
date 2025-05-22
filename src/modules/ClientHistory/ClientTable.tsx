import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
  } from '@mui/x-data-grid';
  import { ClientHistory } from './TypesHistory';
  interface ClientTableProps {
    rows: ClientHistory[];
  }
  
  export default function ClientTable({ rows }: ClientTableProps) {
    const columns: GridColDef[] = [
      { field: 'nombre', headerName: 'Nombre', flex: 1 },
      { field: 'telefono', headerName: 'Teléfono', flex: 1 },
      { field: 'citasPasadas', headerName: 'Citas pasadas', type: 'number', flex: 1 },
      {
        field: 'servicios',
        headerName: 'Servicios realizados',
        flex: 1.5,
        valueGetter: (params: { row: ClientHistory }) => {
            const servicios = params.row?.servicios;
            return Array.isArray(servicios) ? servicios.join(', ') : '';
          },
      },
      {
        field: 'alertaSalud',
        headerName: 'Alertas de salud',
        flex: 1,
        renderCell: (params: GridRenderCellParams) =>
          params.value ? '⚠️ Sí' : '✅ No',
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
  