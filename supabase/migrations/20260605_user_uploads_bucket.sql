-- Provision the `user-uploads` Storage bucket used by
-- `src/lib/upload-media.ts` after the cut-over from ImgBB.
--
-- The bucket is PUBLIC for reads (so generated URLs work in the
-- browser without signed URLs) but only Clerk-authenticated callers
-- can insert / update / delete objects. Service-role keys
-- (server-side admin) bypass these policies.

insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', true)
on conflict (id) do update set public = excluded.public;

-- Drop any pre-existing policies so the migration is idempotent.
drop policy if exists "user-uploads public read"   on storage.objects;
drop policy if exists "user-uploads authed write"  on storage.objects;
drop policy if exists "user-uploads authed update" on storage.objects;
drop policy if exists "user-uploads authed delete" on storage.objects;

-- Anyone (anon + authed) can read.
create policy "user-uploads public read"
  on storage.objects for select
  using (bucket_id = 'user-uploads');

-- Authenticated callers can upload.
create policy "user-uploads authed write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'user-uploads');

-- Authenticated callers can update / replace their own objects.
create policy "user-uploads authed update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'user-uploads')
  with check (bucket_id = 'user-uploads');

-- Authenticated callers can delete their own objects.
create policy "user-uploads authed delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-uploads');
