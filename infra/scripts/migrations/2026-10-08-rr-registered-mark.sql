-- Shayna, 7 Oct: two question marks on the Resonance Repatterning session page.
-- The 7 Oct description migration was piped through PowerShell, which turned
-- the registered mark into "??". This file is ASCII only (chr(174) is the mark)
-- so it survives the same pipe.
begin;

update product
set description = replace(description, 'Repatterning??', 'Repatterning' || chr(174)), updated_at = now()
where handle = 'resonance-repatterning-session' and description like '%Repatterning??%'
returning handle;

commit;

-- Read-only: any other product text with a doubled question mark (expect none).
select handle, 'description' as field from product where deleted_at is null and description like '%??%'
union all
select handle, 'title' from product where deleted_at is null and title like '%??%'
union all
select handle, 'subtitle' from product where deleted_at is null and subtitle like '%??%';
