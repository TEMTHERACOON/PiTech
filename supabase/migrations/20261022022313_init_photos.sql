-- PiTech: photo storage with a hard limit of 5 photos per device.
--
-- "Device" is modelled as a single row in `photo_slots`, keyed by the auth
-- user id when signed in, or by a device id sent from the client otherwise.
-- The 5-photo cap is enforced in the database (a trigger) so it cannot be
-- bypassed by the client, and mirrored in `src/lib/gallery.ts`.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.photo_slots (
  id uuid primary key default gen_random_uuid(),
  -- Owner: auth user id for signed-in users, or a client-generated device id.
  owner_id text not null,
  -- Object path inside the `photos` storage bucket.
  storage_path text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint photo_slots_storage_path_key unique (storage_path)
);

create index if not exists photo_slots_owner_id_idx
  on public.photo_slots (owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Enforce the limit
-- ---------------------------------------------------------------------------

create or replace function public.enforce_photo_limit()
returns trigger
language plpgsql
as $$
declare
  max_photos constant int := 5;
  current_count int;
begin
  select count(*) into current_count
  from public.photo_slots
  where owner_id = new.owner_id;

  if current_count >= max_photos then
    raise exception
      'You can save up to % photos on this device.', max_photos
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists photo_slots_limit on public.photo_slots;
create trigger photo_slots_limit
  before insert on public.photo_slots
  for each row execute function public.enforce_photo_limit();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Applied only once the app signs users in with Supabase Auth. Until then the
-- app runs against the local stack as the `service_role` and RLS is bypassed,
-- so nothing here blocks local development.

alter table public.photo_slots enable row level security;

drop policy if exists "photo_slots_owner_all" on public.photo_slots;
create policy "photo_slots_owner_all"
  on public.photo_slots
  for all
  using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Storage policies for the private `photos` bucket
-- ---------------------------------------------------------------------------

drop policy if exists "photos_owner_read" on storage.objects;
create policy "photos_owner_read"
  on storage.objects
  for select
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_owner_insert" on storage.objects;
create policy "photos_owner_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_owner_update" on storage.objects;
create policy "photos_owner_update"
  on storage.objects
  for update
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_owner_delete" on storage.objects;
create policy "photos_owner_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
