import React, { useEffect, useState } from 'react';
import { supabase } from '../../../components/lib/supabaseClient.ts';
import { Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Question {
  id: string;
  question: string;
}

interface FormsEditProps {
  open: boolean;
  formId: string;
  onClose: () => void;
  onAfterSave?: () => void;
}

export default function FormsEdit({ open, formId, onClose, onAfterSave }: FormsEditProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    if (!open) return;
    const fetchForm = async () => {
      const { data: form } = await supabase.from('custom_forms').select('title').eq('id', formId).single();
      if (form) setTitle(form.title);

      const { data: questionsData } = await supabase.from('custom_form_questions').select('id, question').eq('form_id', formId);
      if (questionsData) setQuestions(questionsData);
    };
    fetchForm();
  }, [formId, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      setSnackbar({ open: true, message: 'El título no puede estar vacío.', severity: 'error' });
      return;
    }
    if (questions.length === 0) {
      setSnackbar({ open: true, message: 'Debe haber al menos una pregunta.', severity: 'error' });
      return;
    }
    if (questions.some(q => !q.question.trim())) {
      setSnackbar({ open: true, message: 'Las preguntas no pueden estar vacías.', severity: 'error' });
      return;
    }
    await supabase.from('custom_forms').update({ title }).eq('id', formId);
    for (const q of questions) {
      await supabase.from('custom_form_questions').update({ question: q.question }).eq('id', q.id);
    }
    setSnackbar({ open: true, message: 'Formulario actualizado', severity: 'success' });
    if (onAfterSave) setTimeout(() => onAfterSave(), 700);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      setSnackbar({ open: true, message: 'La pregunta no puede estar vacía.', severity: 'error' });
      return;
    }
    const { data, error: _error } = await supabase.from('custom_form_questions').insert([{ form_id: formId, question: newQuestion }]).select('id, question').single();
    if (data) setQuestions([...questions, data]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = async (qId: string) => {
    await supabase.from('custom_form_questions').delete().eq('id', qId);
    setQuestions(questions.filter((q) => q.id !== qId));
  };

  const handleQuestionChange = (qId: string, value: string) => {
    setQuestions(
      questions.map(q => q.id === qId ? { ...q, question: value } : q)
    );
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth>
        <DialogTitle>Editar Formulario</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          {questions.map((q) => (
            <Box key={q.id} display="flex" alignItems="center" gap={1} my={1}>
              <TextField
                fullWidth
                value={q.question}
                onChange={(e) => handleQuestionChange(q.id, e.target.value)}
              />
              <IconButton onClick={() => handleRemoveQuestion(q.id)}>
                <CloseIcon />
              </IconButton>
            </Box>
          ))}
          <Box display="flex" gap={1} my={2}>
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
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar Cambios</Button>
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
