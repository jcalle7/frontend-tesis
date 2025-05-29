import { TextField, Button } from '@mui/material';
import { CompanyFormData } from './TypesCompany';

type Props = {
  values: CompanyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function CompanyForm({ values, onChange, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit}>
      <TextField fullWidth name="name" label="Nombre" value={values.name} onChange={onChange} margin="normal" />
      <TextField fullWidth name="ruc" label="RUC" value={values.ruc} onChange={onChange} margin="normal" />
      <TextField fullWidth name="phone" label="Teléfono" value={values.phone} onChange={onChange} margin="normal" />
      <TextField fullWidth name="email" label="Email" value={values.email} onChange={onChange} margin="normal" />
      <TextField fullWidth name="address" label="Dirección" value={values.address} onChange={onChange} margin="normal" />
      <Button variant="contained" type="submit" sx={{ mt: 2 }}>Guardar</Button>
    </form>
  );
}
