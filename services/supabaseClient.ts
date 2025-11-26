
import { createClient } from '@supabase/supabase-js';

// NOTA PARA EL DESARROLLADOR:
// 1. Ve a https://supabase.com y crea un proyecto nuevo.
// 2. Copia la "Project URL" y la "API Key (public/anon)".
// 3. Pégalas aquí abajo.

const supabaseUrl = process.env.SUPABASE_URL || 'https://sxqwlqjobbhktqrnavec.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cXdscWpvYmJoa3Rxcm5hdmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjY0OTgsImV4cCI6MjA3OTY0MjQ5OH0.SfLn70dGil4xtQ0nWL22xAa2bkZO-4yK3GmilElt8yA';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Este archivo será el puente entre Charlitron y tu Base de Datos Real.
