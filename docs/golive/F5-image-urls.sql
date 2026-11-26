-- F5: product image URLs saved with the review IP, moved to the live https address.
-- Prepared 26 Nov 2026 (go-live audit). Run ONLY at runbook step F5, after F4 passes,
-- with Johan's yes. Medusa database, one transaction. Nothing else is changed.
--
-- Why: Medusa file-local saved every uploaded product image as
-- NEXT_PUBLIC_SITE_URL + /uploads/..., so the rows hold http://169.239.180.49/uploads/...
-- On the https site that is mixed content, and next/image refuses the host once the web
-- build allows only https://suzanneravenall.com. 26 Nov, live store API: 51 of 54
-- product image URLs start with http://169.239.180.49.
--
-- Run on the VPS, from infra/:
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d medusa -v ON_ERROR_STOP=1 -At' < ../docs/golive/F5-image-urls.sql
--
-- Rollback (same transaction shape, the other way round):
--   update image   set url       = replace(url,       'https://suzanneravenall.com/uploads/', 'http://169.239.180.49/uploads/') where url       like 'https://suzanneravenall.com/uploads/%';
--   update product set thumbnail = replace(thumbnail, 'https://suzanneravenall.com/uploads/', 'http://169.239.180.49/uploads/') where thumbnail like 'https://suzanneravenall.com/uploads/%';
-- The files themselves do not move: nginx serves /uploads/ from the same volume on both.

begin;

select 'before: image rows with IP: '         || count(*) from image   where url       like 'http://169.239.180.49/%' and deleted_at is null;
select 'before: product thumbnails with IP: ' || count(*) from product where thumbnail like 'http://169.239.180.49/%' and deleted_at is null;

update image
   set url = replace(url, 'http://169.239.180.49/uploads/', 'https://suzanneravenall.com/uploads/')
 where url like 'http://169.239.180.49/uploads/%';

update product
   set thumbnail = replace(thumbnail, 'http://169.239.180.49/uploads/', 'https://suzanneravenall.com/uploads/')
 where thumbnail like 'http://169.239.180.49/uploads/%';

-- Anything left with the IP is not an upload path: stop and look before committing.
select 'after: image rows with IP: '         || count(*) from image   where url       like 'http://169.239.180.49%';
select 'after: product thumbnails with IP: ' || count(*) from product where thumbnail like 'http://169.239.180.49%';

do $$
begin
  if exists (select 1 from image where url like 'http://169.239.180.49%')
     or exists (select 1 from product where thumbnail like 'http://169.239.180.49%') then
    raise exception 'IP URLs remain outside /uploads/: rolled back, nothing changed';
  end if;
end $$;

commit;
