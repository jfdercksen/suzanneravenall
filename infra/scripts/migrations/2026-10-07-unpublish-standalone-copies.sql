-- Johan, 7 Oct: unpublish the older standalone copies of products that now
-- exist as one merged product with formats, so each course is sold once (as on
-- the current site). Status goes to draft: nothing is deleted, and setting it
-- back to published undoes it. Safety: a row only changes if it really is a
-- standalone copy (course on the product, no category, published).
-- Kept published on purpose: resonance-repatterning-group-session-communication,
-- the only way to buy the recorded Communication course (1776395); question to
-- Suzanne's team.
begin;

create table if not exists product_status_bak_20261007 as
  select id, handle, status from product where handle in (
    'love-relationships-live-via-zoom', 'love-relationships-self-study',
    'resonance-repatterning-group-session-boundary-setting',
    'resonance-repatterning-group-session-shedding-excess-weight',
    'resonance-repatterning-program-2-primary-patterns-live',
    'resonance-repatterning-program-2-primary-patterns-self-study',
    'resonance-repatterning-program-3-unconscious-patterns-self-study',
    'resonance-repatterning-program-4-chakra-patterns-self-study',
    'resonance-repatterning-program-5-five-elements-meridians-self-study',
    'resonance-repatterning-program-7-principle-of-relationships-self-study',
    'resonance-repatterning-program-9-energetics-of-relationships-self-study');

update product p set status = 'draft', updated_at = now()
where p.id in (select id from product_status_bak_20261007)
  and p.deleted_at is null and p.status = 'published'
  and p.metadata->>'thinkific_course_id' is not null
  and not exists (select 1 from product_category_product pcp where pcp.product_id = p.id)
returning p.handle, p.status;

commit;

-- What is still published as a standalone copy afterwards (expect only Communication).
select p.handle, p.metadata->>'thinkific_course_id' as course
from product p
where p.deleted_at is null and p.status = 'published'
  and p.metadata->>'thinkific_course_id' is not null
  and not exists (select 1 from product_category_product pcp where pcp.product_id = p.id)
order by p.handle;
