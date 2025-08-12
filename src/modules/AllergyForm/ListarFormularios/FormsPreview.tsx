import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../components/lib/supabaseClient';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Question {
  id: string;
  question: string;
}

export default function FormPreview() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForm = async () => {
      const { data: form } = await supabase.from('custom_forms').select('title').eq('id', id).single();
      if (form) setTitle(form.title);

      const { data: questionsData } = await supabase.from('custom_form_questions').select('id, question').eq('form_id', id);
      if (questionsData) setQuestions(questionsData);
    };
    fetchForm();
  }, [id]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 0 } }}>
      <Typography variant="h4" gutterBottom>
        Vista Previa del Formulario
      </Typography>
      <Typography variant="h6">{title}</Typography>
      {questions.map((q, idx) => (
        <Box key={q.id} my={1}>
          <Typography>{`${idx + 1}. ${q.question}`}</Typography>
        </Box>
      ))}
      <Button 
      variant="contained" 
      color="secondary"
      size="large" 
      startIcon={<ArrowBackIcon />}
      sx={{ mb: 2 }} 
      onClick={() => navigate('/allergy')}>
        REGRESAR
      </Button>
    </Box>
  );
}
