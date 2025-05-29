import { SxProps } from '@mui/material';

export const actionButtonsContainerAppointments: SxProps = {
  display: 'flex',
  gap: 50,
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%', // ¡Clave para que tome toda la celda!
};

export const acceptButtonStyleAppointments: SxProps = {
  minWidth: 100,
  paddingX: 3,
  paddingY: 0.8,
};

export const cancelButtonStyleAppointments: SxProps = {
  minWidth: 100,
  paddingX: 3,
  paddingY: 0.8,
};
