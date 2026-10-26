-- Photo-booth galleries are no longer capped per device.
drop trigger if exists photo_slots_limit on public.photo_slots;
drop function if exists public.enforce_photo_limit();
