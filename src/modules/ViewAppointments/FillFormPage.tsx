import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../components/lib/supabaseClient";
import {
  Box, Button, CircularProgress, Typography, TextField,
  FormControl, FormLabel, RadioGroup, Radio, FormControlLabel,
  Checkbox, Select, MenuItem
} from "@mui/material";

type FieldType =
  | "text" | "textarea" | "number" | "date"
  | "radio" | "checkbox" | "select" | "yesno";

type Field = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

type Form = {
  id: string;
  title: string;
  company_id: string;
  fields: Field[];
};

export default function FillFormPage() {
  const { formId, clientId } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      // 1) Trae el formulario
      const { data: formRow, error: formErr } = await supabase
        .from("custom_forms")
        .select("id, title, company_id, fields")
        .eq("id", formId)
        .maybeSingle();

      if (formErr || !formRow) {
        setError("Formulario no encontrado.");
        setLoading(false);
        return;
      }

      // 2) Intenta usar fields (jsonb) si existen
      let fields: Field[] = [];
      const raw = (formRow as any).fields;
      if (Array.isArray(raw) && raw.length > 0) {
        fields = raw as Field[];
      } else {
        // 3) Fallback: lee de custom_form_questions (tus preguntas actuales)
        const { data: qRows, error: qErr } = await supabase
          .from("custom_form_questions")
          .select("id, question")
          .eq("form_id", formRow.id)
          .order("id", { ascending: true });

        if (qErr) {
          setError("No se pudieron cargar las preguntas.");
          setLoading(false);
          return;
        }

        // Las mapeamos como preguntas de tipo Sí/No por defecto
        fields = (qRows || []).map((q: any) => ({
          id: q.id,
          label: q.question,
          type: "text",   
          required: true,
        }));
      }

      setForm({
        id: formRow.id,
        title: formRow.title ?? "Formulario",
        company_id: formRow.company_id,
        fields,
      });

      // Inicializa respuestas
      const init: Record<string, any> = {};
      fields.forEach((f) => {
        init[f.id] = f.type === "checkbox" ? [] : "";
      });
      setAnswers(init);

      setLoading(false);
    })();
  }, [formId]);

  const setValue = (fid: string, value: any) =>
    setAnswers((prev) => ({ ...prev, [fid]: value }));

  const toggleCheckbox = (fid: string, value: string) => {
    setAnswers((prev) => {
      const arr: string[] = Array.isArray(prev[fid]) ? prev[fid] : [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [fid]: next };
    });
  };

  const validate = (): string | null => {
    if (!form) return "Formulario inválido.";
    for (const f of form.fields) {
      const v = answers[f.id];
      if (f.required) {
        if (f.type === "checkbox" && (!Array.isArray(v) || v.length === 0)) return `Completa: ${f.label}`;
        if (v === "" || v === null || v === undefined) return `Completa: ${f.label}`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const vErr = validate();
    if (vErr) { setError(vErr); return; }
    if (!form || !clientId) { setError("Faltan datos."); return; }

    setSending(true);
    setError("");

    // Normaliza yes/no a booleano
    const normalized: Record<string, any> = { ...answers };
    form.fields.forEach((f) => {
      if (f.type === "yesno") {
        const val = answers[f.id];
        if (typeof val === "string") {
          const t = val.toLowerCase();
          normalized[f.id] = t === "sí" || t === "si" ? true : t === "no" ? false : val;
        }
      }
    });

    const { error } = await supabase.from("form_submissions").insert({
      form_id: form.id,
      client_id: clientId,
      company_id: form.company_id,
      responses: normalized,
    });

    setSending(false);
    if (error) setError(error.message || "No se pudo enviar.");
    else setSent(true);
  };

  if (loading) return <CircularProgress />;
  if (error && !form) return <Typography color="error">{error}</Typography>;
  if (!form) return <Typography>Formulario no encontrado</Typography>;

  return (
    <Box sx={{ mt: 10, px: 4, maxWidth: 900 }}>
      <Typography variant="h4" gutterBottom>{form.title}</Typography>

      {sent ? (
        <Typography variant="h6" color="success.main">¡Gracias! Tu respuesta ha sido registrada.</Typography>
      ) : (
        <>
          {form.fields.length === 0 && (
            <Typography color="text.secondary">Este formulario no tiene preguntas.</Typography>
          )}

          {form.fields.map((f) => (
            <Box key={f.id} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ mb: .5 }}>{f.label}{f.required ? " *" : ""}</FormLabel>

                {f.type === "text" && (
                  <TextField fullWidth value={answers[f.id] ?? ""} onChange={(e) => setValue(f.id, e.target.value)} />
                )}
                {f.type === "textarea" && (
                  <TextField fullWidth multiline minRows={3} value={answers[f.id] ?? ""} onChange={(e) => setValue(f.id, e.target.value)} />
                )}
                {f.type === "number" && (
                  <TextField type="number" fullWidth value={answers[f.id] ?? ""} onChange={(e) => setValue(f.id, e.target.value)} />
                )}
                {f.type === "date" && (
                  <TextField type="date" fullWidth value={answers[f.id] ?? ""} onChange={(e) => setValue(f.id, e.target.value)} InputLabelProps={{ shrink: true }} />
                )}
                {f.type === "select" && (
                  <Select value={answers[f.id] ?? ""} onChange={(e) => setValue(f.id, e.target.value)}>
                    {(f.options || []).map((op) => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                  </Select>
                )}
                {f.type === "radio" && (
                  <RadioGroup value={answers[f.id] ?? ""} onChange={(e) => setValue(f.id, e.target.value)}>
                    {(f.options || []).map((op) => <FormControlLabel key={op} value={op} control={<Radio />} label={op} />)}
                  </RadioGroup>
                )}
                {f.type === "checkbox" && (
                  <Box>
                    {(f.options || []).map((op) => {
                      const current: string[] = answers[f.id] || [];
                      const checked = current.includes(op);
                      return (
                        <FormControlLabel
                          key={op}
                          control={<Checkbox checked={checked} onChange={() => toggleCheckbox(f.id, op)} />}
                          label={op}
                        />
                      );
                    })}
                  </Box>
                )}
                {f.type === "yesno" && (
                  <Select value={answers[f.id] ?? ""} onChange={(e) => setValue(f.id, e.target.value)}>
                    <MenuItem value="Sí">Sí</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                )}
              </FormControl>
            </Box>
          ))}

          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}

          <Button onClick={handleSubmit} disabled={sending} variant="contained" sx={{ mt: 2 }}>
            {sending ? "Enviando..." : "ENVIAR RESPUESTA"}
          </Button>
        </>
      )}
    </Box>
  );
}
