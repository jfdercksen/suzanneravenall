-- Cassidy, 8 Oct: no Thinkific enrolment for Akashic Navigator 1&2, Deep Energy
-- Clearing 1 and 2, RR Accelerated Basic 5. Their variants had no course id.
-- Ids from Thinkific (exact course names, live enrolments since Oct 2025; the
-- "purchased together" lists are the Thinkific bundles' own course lists).
-- Live via Zoom and Live Retaker only: Self Study waits on the team (old vs "New" courses).
begin;
create table if not exists product_variant_metadata_bak_20261008 as
  select v.id, v.metadata from product_variant v
  join product p on p.id = v.product_id
  where p.handle like 'akashic-navigator-intuitive-coaching-%'
     or p.handle like 'deep-energy-clearing-%'
     or p.handle like 'resonance-repatterning-accelerated-basic-5-training-series-%'
     or p.handle = 'resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom';

update product_variant v
set metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object('thinkific_course_id', m.cid)
from product p, (values
  ('akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom', 'Live via Zoom', '2434137'),
  ('akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom', 'Live Retaker', '2434137'),
  ('akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom', 'Live via Zoom', '2434102'),
  ('akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom', 'Live Retaker', '2434102'),
  ('akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-live-via-zoom', 'Live via Zoom', '2434137,2434102'),
  ('akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-live-via-zoom', 'Live Retaker', '2434137,2434102'),
  ('deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom', 'Live via Zoom', '1892663'),
  ('deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom', 'Live Retaker', '1892663'),
  ('deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom', 'Live via Zoom', '1892662'),
  ('deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom', 'Live Retaker', '1892662'),
  ('deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom', 'Live via Zoom', '1892663,1892662'),
  ('deep-energy-clearing-fundamentals-advanced-purchased-together-live-via-zoom', 'Live Retaker', '1892663,1892662'),
  ('resonance-repatterning-accelerated-basic-5-training-series-review-of-programs-1-5-live-via-zoom', 'Live via Zoom', '2353636'),
  ('resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom', 'Live via Zoom', '1349879,1383462,1402405,1405974,1505335')
) as m(handle, fmt, cid)
where v.product_id = p.id and p.handle = m.handle and v.title = m.fmt
  and v.deleted_at is null and p.deleted_at is null;

select p.handle, v.title as format, v.metadata->>'thinkific_course_id' as variant_course
from product p join product_variant v on v.product_id = p.id and v.deleted_at is null
where p.handle like 'akashic-navigator-intuitive-coaching-%'
   or p.handle like 'deep-energy-clearing-%'
   or p.handle like 'resonance-repatterning-accelerated-basic-5-training-series-%'
   or p.handle = 'resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom'
order by p.handle, v.title;
commit;
