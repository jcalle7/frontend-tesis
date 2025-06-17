export type Client = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  comments?: string;
  company_id: string;
  password_hash?: string;  // ahora opcional, para no romper lecturas
  role_id?: string; // ⬅️ solo lectura interna, no editable desde UI

};
