import './App.css'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { esES as coreEsES } from '@mui/material/locale';
import { esES as gridEsES } from '@mui/x-data-grid/locales';
import { esES as pickersEsES } from '@mui/x-date-pickers/locales';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';

import { RouterProvider } from 'react-router-dom';
import { router } from "./router/routers.tsx";

const theme = createTheme(
  coreEsES,   // MUI core en español
  gridEsES,   // DataGrid en español (incluye "Filas por página")
  pickersEsES // Date/Time Pickers en español
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="es"
        localeText={pickersEsES.components.MuiLocalizationProvider.defaultProps.localeText}
      >
        <CssBaseline />
        <RouterProvider router={router} />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
