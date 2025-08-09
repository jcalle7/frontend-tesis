import { Typography, Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DynamicAllergyForm from "../AllergyForm/DynamicAllergyForm.tsx";
import FormsTable from "../AllergyForm/ListarFormularios/FormsTable.tsx";
import { useState } from 'react';
import { containerStylesAllergy, titleStylesAllergy } from "../AllergyForm/Styles/AllergyClientPage.styles.ts";

export default function AllergyClientPage() {
  const [openCreate, setOpenCreate] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const handleAfterSave = () => {
    setOpenCreate(false);
    setRefresh(r => !r); // Esto forzará el refresh en la tabla
  };

  return (
    <Box sx={containerStylesAllergy}>
      <Typography variant="h4" sx={titleStylesAllergy}>
        FORMULARIOS
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          AÑADIR FORMULARIO
        </Button>
      </Box>
      {/* Modal de creación */}
      <DynamicAllergyForm
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onAfterSave={handleAfterSave}
      />
      {/* Tabla de formularios, con prop para refrescar al crear/editar */}
      <FormsTable refresh={refresh} />
    </Box>
  );
}
