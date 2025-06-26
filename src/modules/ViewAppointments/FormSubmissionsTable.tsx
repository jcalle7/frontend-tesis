import { useEffect, useState } from "react";
import { supabase } from "../../components/lib/supabaseClient.ts";
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";

export default function FormSubmissionsTable() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Obtener empresa del usuario
      const { data: empresaData, error: errEmpresa } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (errEmpresa) return console.error("Error empresa:", errEmpresa.message);
      setCompanyId(empresaData.company_id);

      const { data, error } = await supabase
        .from("form_submissions")
        .select(`
          id,
          created_at,
          responses,
          custom_forms ( title ),
          clients ( first_name, last_name )
        `)
        .eq("company_id", empresaData.company_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando submissions:", error.message);
      } else {
        setSubmissions(data);
      }

      setLoading(false);
    };

    fetchSubmissions();
  }, []);

  if (loading) return <CircularProgress sx={{ mt: 5 }} />;

  return (
    <Box sx={{ mt: 10, px: 4 }}>
      <Typography variant="h4" gutterBottom>
        Formularios Recibidos
      </Typography>

      {submissions.length === 0 ? (
        <Typography>No se han recibido formularios aún.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Formulario</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Respuestas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.clients?.first_name} {s.clients?.last_name}</TableCell>
                  <TableCell>{s.custom_forms?.title}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <pre>{JSON.stringify(s.responses, null, 2)}</pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
