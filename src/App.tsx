import './App.css'
import { CssBaseline } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routers';


function App() {

  return (
    <>
      <CssBaseline />
      <RouterProvider router={router} />
    </>
  )
}

export default App
