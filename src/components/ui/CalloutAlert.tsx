import { Alert, AlertColor, AlertTitle } from '@mui/material';
import React from 'react';

type Props = {
  severity: AlertColor;
  title: string;
  message: string;
};

export default function CalloutAlert({ severity, title, message }: Props) {
  return (
    <Alert severity={severity} variant="filled" sx={{ mb: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}
