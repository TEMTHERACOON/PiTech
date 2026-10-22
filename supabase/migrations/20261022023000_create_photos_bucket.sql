-- PiTech: create the private `photos` storage bucket.
--
-- The bucket is declared in `supabase/config.toml` for the local stack, but
-- that file does not create it on a hosted project, so it is created here as
-- well. `on conflict do nothing` keeps this migration safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  10485760, -- 10 MiB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
