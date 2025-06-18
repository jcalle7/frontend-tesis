  import {
      DataGrid,
      GridColDef,
      GridRenderCellParams,
    } from '@mui/x-data-grid';
  import { ClientHistory } from "./TypesHistory.tsx";
    interface ClientTableProps {
      rows: ClientHistory[];
    }
  import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
  import VisibilityIcon from '@mui/icons-material/Visibility';
  import { useState } from 'react';
  import React from 'react';

  export default function ClientTable({ rows }: ClientTableProps) {
      const [modalOpen, setModalOpen] = useState(false);
      const [alertaActual, setAlertaActual] = useState<ClientHistory | null>(null);

      const handleVerAlerta = (cliente: ClientHistory) => {
      setAlertaActual(cliente);
      setModalOpen(true);
      };

      const handleCerrarModal = () => {
      setModalOpen(false);
      setAlertaActual(null);
      };

      const columns: GridColDef[] = [
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'telefono', headerName: 'Teléfono', flex: 1 },
        { field: 'citasPasadas', headerName: 'Citas pasadas', type: 'number', flex: 1 },
        {
          field: 'servicios',
          headerName: 'Servicios realizados',
          flex: 1.5,
          renderCell: (params: GridRenderCellParams) => {
            const servicios = params.row?.servicios;
            if (Array.isArray(servicios) && servicios.length > 0) {
            return servicios.join(', ');
          }
          return '—';  
        },

      },
        {
          field: 'alertaSalud',
          headerName: 'Alertas de salud',
          flex: 1,
          renderCell: (params: GridRenderCellParams) =>
            params.value ? '⚠️ Sí' : '✅ No',
        },
        {
        field: 'acciones',
          headerName: 'Ver más',
          flex: 0.5,
          renderCell: (params: GridRenderCellParams) => (
            <Tooltip title={params.row.alertaSalud ? 'Ver alerta de salud' : 'Sin alergias'}>
              <span>
                <IconButton
                  color="primary"
                  disabled={!params.row.alertaSalud}
                  onClick={() => handleVerAlerta(params.row)}
                >
                  <VisibilityIcon />
                </IconButton>
              </span>
            </Tooltip>
          ),
        }
      ];
    
      return (
        <div style={{ width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            
          />
          <Dialog open={modalOpen} onClose={handleCerrarModal}>
            <DialogTitle>Alerta de Salud</DialogTitle>
            <DialogContent>
              {alertaActual?.alertaSalud ? (
                <p>{alertaActual?.detalleAlerta || 'Alergia registrada, pero sin detalle específico.'}</p>
              ) : (
                <p>Este cliente no posee ninguna alergia registrada.</p>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCerrarModal} variant='contained' color="error">
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      );
    }
    