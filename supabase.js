const SUPABASE_URL = 'https://kwdapcjhhrxijvpteflg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZGFwY2poaHJ4aWp2cHRlZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTA1MzksImV4cCI6MjEwNDk4NjUzOX0.SJYrdYjbwvKNp8f1YzkdLVl5HyrGqVNPg-GFzznJuao';


export const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);