-- Drop any auto-generated FK on parent_id and recreate with explicit name
do $$ begin
  -- Find and drop existing FK on parent_id
  perform 1 from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
  where tc.table_name = 'tickets'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'parent_id';

  if found then
    execute (
      select 'alter table tickets drop constraint ' || tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
      where tc.table_name = 'tickets'
        and tc.constraint_type = 'FOREIGN KEY'
        and kcu.column_name = 'parent_id'
      limit 1
    );
  end if;
end $$;

-- Recreate with the exact name PostgREST expects
alter table tickets
  add constraint tickets_parent_id_fkey
  foreign key (parent_id) references tickets(id) on delete set null;

-- Same for epic_id
do $$ begin
  perform 1 from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
  where tc.table_name = 'tickets'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'epic_id';

  if found then
    execute (
      select 'alter table tickets drop constraint ' || tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
      where tc.table_name = 'tickets'
        and tc.constraint_type = 'FOREIGN KEY'
        and kcu.column_name = 'epic_id'
      limit 1
    );
  end if;
end $$;

alter table tickets
  add constraint tickets_epic_id_fkey
  foreign key (epic_id) references tickets(id) on delete set null;

-- Reload schema cache
select reload_pgrst();
