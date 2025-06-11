import React from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ServiceData } from '../ServicesLanding/TypesServices.tsx';

interface Props {
  services: ServiceData[];
  onEdit: (service: ServiceData) => void;
  onDelete: (id: number) => void;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
}

export default function ServiceTable({ services, onEdit, onDelete, paginationModel, onPaginationModelChange }: Props) {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    {
      field: 'precio',
      headerName: 'Precio',
      flex: 1,
      renderCell: (params) => `$${parseFloat(params.value).toFixed(2)}`
    },
    {
      field: 'duracion',
      headerName: 'Duración',
      flex: 1,
      renderCell: (params) => {
      const minutos = Number(params.value);
      return minutos >= 60
      ? `${minutos / 60} hora(s)`
      : `${minutos} minuto(s)`;
      },
    },
    { field: 'descripcion', headerName: 'Descripción', flex: 1 },
    {
      field: 'imagen',
      headerName: 'Imagen',
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <img
            src={params.value}
            alt="preview"
            style={{ width: 40, height: 40, cursor: 'pointer', objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          'Sin imagen'
        ),
    },
    {
      field: 'editar',
      headerName: 'Editar',
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => onEdit(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    },
    {
      field: 'eliminar',
      headerName: 'Eliminar',
      renderCell: (params) => (
        <IconButton color="error" onClick={() => onDelete(params.row.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box mt={4} sx={{ width: '100%', maxWidth: '100%', minWidth: 1000, height: 300 }}>
      <DataGrid
        rows={services}
        columns={columns}
        getRowId={(row) => row.id}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        disableRowSelectionOnClick
      />
    </Box>
  );
}
