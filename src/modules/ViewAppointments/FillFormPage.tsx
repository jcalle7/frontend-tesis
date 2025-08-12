import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../components/lib/supabaseClient";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

interface Form {
  id: string;
  title: string;
}

export default function FillFormPage() {
  const { formId, clientId } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState("");
  const [hasAllergies, setHasAllergies] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error } = await supabase
        .from("custom_forms")
        .select("id, title")
        .eq("id", formId)
        .single();

      if (!error) setForm(data);
      setLoading(false);
    };

    fetchForm();
  }, [formId]);

  const handleSubmit = async () => {
    if (!formId || !clientId || !form) return;

    // Obtener empresa del cliente
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("company_id")
      .eq("id", clientId)
      .single();

    if (clientError) {
      alert("Error obteniendo datos del cliente.");
      return;
    }

    const response = {
      hasAllergies,
      details,
    };

    const { error } = await supabase.from("form_submissions").insert([
      {
        form_id: formId,
        client_id: clientId,
        company_id: clientData.company_id,
        responses: response,
      },
    ]);

    if (!error) {
      setSubmitted(true);
    }
  };

  if (loading) return <CircularProgress />;

  if (!form) return <Typography>Formulario no encontrado</Typography>;

  return (
    <Box sx={{ mt: 10, px: 4 }}>
      <Typography variant="h4" gutterBottom>
        {form.title}
      </Typography>

      {submitted ? (
        <Typography variant="h6" color="success.main">
          ¡Gracias! Tu respuesta fue enviada correctamente.
        </Typography>
      ) : (
        <>
          <TextField
            label="¿Tiene alergias?"
            value={hasAllergies ? "Sí" : "No"}
            onClick={() => setHasAllergies(!hasAllergies)}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Detalles (si aplica)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
          />

          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Enviar Respuesta
          </Button>
        </>
      )}
    </Box>
  );
}
