-- Johan, 7 Oct, round 2: five more standalone copies of formats that the merged
-- Program 1, 6, 7 and 9 products already sell. Status to draft; nothing deleted.
-- Same safety check as round 1 (course on the product, no category, published).
begin;

insert into product_status_bak_20261007 (id, handle, status)
  select id, handle, status from product where handle in (
    'resonance-repatterning-resonance-repatterning-program-1-fundamentals-self-study',
    'resonance-repatterning-inner-cultivation',
    'resonance-repatterning-inner-cultivation-self-study',
    'resonance-repatterning-principles-of-relationship-live',
    'resonance-repatterning-energetics-of-relationship-live')
  and id not in (select id from product_status_bak_20261007);

update product p set status = 'draft', updated_at = now()
where p.handle in (
    'resonance-repatterning-resonance-repatterning-program-1-fundamentals-self-study',
    'resonance-repatterning-inner-cultivation',
    'resonance-repatterning-inner-cultivation-self-study',
    'resonance-repatterning-principles-of-relationship-live',
    'resonance-repatterning-energetics-of-relationship-live')
  and p.deleted_at is null and p.status = 'published'
  and p.metadata->>'thinkific_course_id' is not null
  and not exists (select 1 from product_category_product pcp where pcp.product_id = p.id)
returning p.handle, p.status;

commit;

-- Read-only: published products whose stock record still says "requires
-- shipping". A digital product listed here cannot be checked out (the live
-- group seat error); a physical one (the book) should stay.
select p.handle, v.title as format, v.manage_inventory as managed,
       (select string_agg(c.handle, ',') from product_category_product pcp join product_category c on c.id = pcp.product_category_id where pcp.product_id = p.id) as categories
from product p join product_variant v on v.product_id = p.id and v.deleted_at is null
join product_variant_inventory_item pvi on pvi.variant_id = v.id
join inventory_item ii on ii.id = pvi.inventory_item_id
where p.deleted_at is null and p.status = 'published' and ii.requires_shipping
order by p.handle, v.title;
