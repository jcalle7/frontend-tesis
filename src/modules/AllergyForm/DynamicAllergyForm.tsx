import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { supabase } from '../../components/lib/supabaseClient';  

interface Question {
  id: number;
  label: string;
}

interface DynamicAllergyFormProps {
  open: boolean;
  onClose: () => void;
  onAfterSave?: () => void;
}

export default function DynamicAllergyForm({ open, onClose, onAfterSave }: DynamicAllergyFormProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [counter, setCounter] = useState(1);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    const fetchCompanyId = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      const { data, error: _error } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.user.id)
        .single();

      if (data?.company_id) {
        setCompanyId(data.company_id);
      } else {
        setSnackbar({ open: true, message: '⚠️ No se encontró la empresa asociada.', severity: 'error' });
      }
    };
    fetchCompanyId();
  }, []);

  // Reset al abrir/cerrar modal
  useEffect(() => {
    if (!open) {
      setTitle('');
      setQuestions([]);
      setNewQuestion('');
      setCounter(1);
    }
  }, [open]);

  const handleAddQuestion = () => {
    if (newQuestion.trim() !== '') {
      setQuestions([...questions, { id: counter, label: newQuestion }]);
      setNewQuestion('');
      setCounter(counter + 1);
    } else {
      setSnackbar({ open: true, message: 'La pregunta no puede estar vacía.', severity: 'error' });
    }
  };

  const handleRemoveQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setSnackbar({ open: true, message: 'El título no puede estar vacío.', severity: 'error' });
      return;
    }
    if (questions.length === 0) {
      setSnackbar({ open: true, message: 'Agrega al menos una pregunta.', severity: 'error' });
      return;
    }
    if (questions.some(q => !q.label.trim())) {
      setSnackbar({ open: true, message: 'Las preguntas no pueden estar vacías.', severity: 'error' });
      return;
    }
    if (!companyId) {
      setSnackbar({ open: true, message: 'No se pudo asociar formulario a una empresa.', severity: 'error' });
      return;
    }

    const { data: formData, error: formError } = await supabase
      .from('custom_forms')
      .insert([{ title, company_id: companyId }])
      .select('id')
      .single();

    if (formError || !formData) {
      setSnackbar({ open: true, message: `❌ Error al guardar el formulario: ${formError?.message}`, severity: 'error' });
      return;
    }

    const questionsPayload = questions.map(q => ({
      form_id: formData.id,
      question: q.label
    }));

    const { error: questionsError } = await supabase
      .from('custom_form_questions')
      .insert(questionsPayload);

    if (questionsError) {
      setSnackbar({ open: true, message: `❌ Error al guardar preguntas: ${questionsError.message}`, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: '✅ Formulario guardado con éxito', severity: 'success' });
      if (onAfterSave) onAfterSave();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleCancel} fullWidth>
        <DialogTitle>Crear Formulario Personalizado</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título del Formulario"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />

          {questions.map((q) => (
            <Box key={q.id} display="flex" alignItems="center" gap={1} mt={1}>
              <TextField fullWidth value={q.label} disabled />
              <IconButton onClick={() => handleRemoveQuestion(q.id)}><CloseIcon /></IconButton>
            </Box>
          ))}

          <Box display="flex" gap={1} mt={2}>
            <TextField
              fullWidth
              label="Nueva Pregunta"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <Button variant="outlined" onClick={handleAddQuestion}>Agregar</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="error">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="success">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
