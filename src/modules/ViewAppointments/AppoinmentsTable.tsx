import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Button, Chip, Box, Tooltip } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import React from 'react';
import { AppointmentData } from "./TypesCitas";
import { actionButtonsContainerAppointments, acceptButtonStyleAppointments, cancelButtonStyleAppointments } from "./Styles/AppointmentTable.styles";

interface AppointmentTableProps {
  rows: AppointmentData[];
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
  onSendForm: (id: string) => void;
  onRemind: (id: string) => void;                 // << nuevo (WhatsApp recordatorio)
  onViewReceipt: (url: string) => void;           // << nuevo (ver comprobante en modal)
  onViewResponses: (clientId: string) => void;    // << nuevo (ver respuestas por cliente)
}

export default function AppointmentTable({
  rows,
  onAccept,
  onCancel,
  onSendForm,
  onRemind,
  onViewReceipt,
  onViewResponses
}: AppointmentTableProps) {

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const estado = String(params.value ?? '').toLowerCase();
        type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
        let color: ChipColor = 'default';
        if (estado === 'aceptada') color = 'success';
        else if (estado === 'pendiente') color = 'warning';
        else if (estado === 'cancelada') color = 'error';
        else if (estado === 'terminada') color = 'info';

        const label = estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : '—';
        return <Chip label={label} color={color} />;
      },
    },
    { field: 'fecha', headerName: 'Fecha', flex: 1 },
    { field: 'hora', headerName: 'Hora', flex: 1 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 2.6,
      renderCell: (params: GridRenderCellParams) => {
        const estado = String(params.row.estado ?? '').toLowerCase();
        const canAction = estado === 'pendiente';
        const canRemind = Boolean(params.row.telefono);
        return (
          <div style={actionButtonsContainerAppointments as React.CSSProperties}>
            <Button
              color="primary"
              variant="contained"
              onClick={() => onAccept(params.row.id)}
              sx={acceptButtonStyleAppointments}
              disabled={!canAction}
            >
              ACEPTAR
            </Button>

            <Button
              color="error"
              variant="outlined"
              onClick={() => onCancel(params.row.id)}
              sx={cancelButtonStyleAppointments}
              disabled={!canAction}
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

            <Tooltip title={canRemind ? 'Enviar recordatorio por WhatsApp' : 'Sin teléfono'}>
              <span>
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => onRemind(params.row.id)}
                  disabled={!canRemind}
                >
                  RECORDATORIO
                </Button>
              </span>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              onClick={() => onViewResponses(params.row.clientId)}
            >
              VER RESPUESTAS
            </Button>
          </div>
        );
      },
    },
    {
      field: 'comprobante',
      headerName: 'Comprobante',
      flex: 1,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Button
            size="small"
            variant="text"
            onClick={() => onViewReceipt(String(params.value))}
            sx={{ textDecoration: 'underline' }}
          >
            Ver comprobante
          </Button>
        ) : (
          <span>—</span>
        ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
        autoHeight
      />
    </Box>
  );
}
