import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import React from 'react';

interface Question {
  id: number;
  label: string;
}

export default function DynamicAllergyForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [counter, setCounter] = useState(1);

  const handleAddQuestion = () => {
    if (newQuestion.trim() !== '') {
      setQuestions([...questions, { id: counter, label: newQuestion }]);
      setNewQuestion('');
      setCounter(counter + 1);
    }
  };

  const handleRemoveQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSave = () => {
    console.log('Formulario guardado:', { title, questions });
    setOpen(false);
    setTitle('');
    setQuestions([]);
    setCounter(1);
  };

  const handleCancel = () => {
    setOpen(false);
    setTitle('');
    setQuestions([]);
    setCounter(1);
  };

  return (
    <Box>
      <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        AÑADIR FORMULARIO
      </Button>

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
    </Box>
  );
}
