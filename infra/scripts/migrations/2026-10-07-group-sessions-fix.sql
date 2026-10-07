-- Shayna's feedback, 6 Oct. Two data fixes, one transaction, backups first.
--
-- 1. Live group seats could not be ordered: their stock records defaulted to
--    "requires shipping", so Medusa refused to complete the cart ("No shipping
--    method selected but the cart contains items that require shipping").
--    A Zoom seat ships nothing. Scope: stock records of variants whose product
--    is in the group-sessions-live category.
--
-- 2. Thinkific courses per format, as the current WooCommerce site has them
--    (docs/content-source/thinkific-wc-mapping.md): a recorded group series
--    enrols in its "Recorded Group Session Series" course; a live group seat
--    ("booked as a series only") has no course. Love & Relationships formats
--    get their Live via Zoom and Self Study courses.
--    Not mapped on purpose, to ask Suzanne's team: Develop Super Confidence and
--    Attraction Frequency (recorded) were "Coming Soon" on the current site with
--    no course linked, although Thinkific has 1901206 and 1901224.
begin;

create table if not exists inventory_item_shipping_bak_20261007 as
  select ii.id, ii.requires_shipping from inventory_item ii
  where ii.id in (
    select pvi.inventory_item_id from product_variant_inventory_item pvi
    join product_variant v on v.id = pvi.variant_id
    join product_category_product pcp on pcp.product_id = v.product_id
    join product_category c on c.id = pcp.product_category_id
    where c.handle = 'group-sessions-live');

update inventory_item set requires_shipping = false, updated_at = now()
where id in (select id from inventory_item_shipping_bak_20261007) and requires_shipping;

create table if not exists product_variant_metadata_bak_20261007 as
  select v.id, v.metadata from product_variant v join product p on p.id = v.product_id
  where p.handle in ('career-progression-group-session', 'money-mastery-group-session',
    'group-session-shedding-excess-weight', 'group-session-being-a-great-boundary-setter-booked-as-a-series-only',
    'love-relationships-group-session', 'love-relationships-live');

update product_variant v
set metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object('thinkific_course_id', m.cid), updated_at = now()
from product p, (values
  ('career-progression-group-session', 'Recorded series', '1405977'),
  ('money-mastery-group-session', 'Recorded series', '1892070'),
  ('group-session-shedding-excess-weight', 'Recorded series', '1696047'),
  ('group-session-being-a-great-boundary-setter-booked-as-a-series-only', 'Recorded series', '1730348'),
  ('love-relationships-group-session', 'Recorded series', '1799794'),
  ('love-relationships-live', 'Live via Zoom', '2434091'),
  ('love-relationships-live', 'Self Study', '1892729')
) as m(handle, fmt, cid)
where v.product_id = p.id and p.handle = m.handle and v.title = m.fmt
  and v.deleted_at is null and p.deleted_at is null;

-- Check: every live seat ships nothing, and the course per format.
select p.handle, v.title as format, v.metadata->>'thinkific_course_id' as course, ii.requires_shipping
from product p join product_variant v on v.product_id = p.id and v.deleted_at is null
left join product_variant_inventory_item pvi on pvi.variant_id = v.id
left join inventory_item ii on ii.id = pvi.inventory_item_id
where p.deleted_at is null and (p.handle in (select handle from product where handle like '%group-session%' or handle like 'group-session%' or handle = 'love-relationships-live'))
order by p.handle, v.title;

commit;

-- Read-only: published products that are older standalone copies of a merged
-- product (a Thinkific course on the product itself and no category).
select p.handle, p.status, p.metadata->>'thinkific_course_id' as course
from product p
where p.deleted_at is null and p.status = 'published'
  and p.metadata->>'thinkific_course_id' is not null
  and not exists (select 1 from product_category_product pcp where pcp.product_id = p.id)
order by p.handle;
