-- Create a helper function to reload PostgREST schema cache
create or replace function reload_pgrst()
returns void
language plpgsql
security definer
as $$
begin
  notify pgrst, 'reload schema';
end;
$$;

-- Trigger the reload
select reload_pgrst();
