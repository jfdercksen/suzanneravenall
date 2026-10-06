begin;
create table if not exists product_variant_metadata_bak_20261006 as
  select v.id, v.metadata from product_variant v
  join product p on p.id = v.product_id
  where p.handle like 'resonance-repatterning-program-%';

update product_variant v
set metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object('thinkific_course_id', m.cid)
from product p, (values
  ('resonance-repatterning-program-1-fundamentals-live-via-zoom', 'Live via Zoom', '1349879'),
  ('resonance-repatterning-program-1-fundamentals-live-via-zoom', 'Live Retaker', '1349879'),
  ('resonance-repatterning-program-1-fundamentals-live-via-zoom', 'Self Study', '2165207'),
  ('resonance-repatterning-program-2-primary-patterns-live-via-zoom', 'Live via Zoom', '1383462'),
  ('resonance-repatterning-program-2-primary-patterns-live-via-zoom', 'Live Retaker', '1383462'),
  ('resonance-repatterning-program-2-primary-patterns-live-via-zoom', 'Self Study', '2165208'),
  ('resonance-repatterning-program-3-unconscious-patterns-live-via-zoom', 'Live via Zoom', '1402405'),
  ('resonance-repatterning-program-3-unconscious-patterns-live-via-zoom', 'Live Retaker', '1402405'),
  ('resonance-repatterning-program-3-unconscious-patterns-live-via-zoom', 'Self Study', '2165227'),
  ('resonance-repatterning-program-4-chakra-patterns-live-via-zoom', 'Live via Zoom', '1405974'),
  ('resonance-repatterning-program-4-chakra-patterns-live-via-zoom', 'Live Retaker', '1405974'),
  ('resonance-repatterning-program-4-chakra-patterns-live-via-zoom', 'Self Study', '2165210'),
  ('resonance-repatterning-program-5-five-elements-meridians-live-via-zoom', 'Live via Zoom', '1505335'),
  ('resonance-repatterning-program-5-five-elements-meridians-live-via-zoom', 'Live Retaker', '1505335'),
  ('resonance-repatterning-program-5-five-elements-meridians-live-via-zoom', 'Self Study', '2165229'),
  ('resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom', 'Live via Zoom', '2165217'),
  ('resonance-repatterning-program-6-inner-cultivation-practical-demos-live-via-zoom', 'Self Study', '3064382'),
  ('resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study', 'Live via Zoom', '2165209'),
  ('resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study', 'Self Study', '3064388'),
  ('resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study', 'Live via Zoom', '2165225'),
  ('resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study', 'Self Study', '3064390')
) as m(handle, fmt, cid)
where v.product_id = p.id and p.handle = m.handle and v.title = m.fmt
  and v.deleted_at is null and p.deleted_at is null;

select p.handle, v.title as format, v.metadata->>'thinkific_course_id' as variant_course
from product p join product_variant v on v.product_id = p.id and v.deleted_at is null
where p.handle like 'resonance-repatterning-program-%-via-zoom'
   or p.handle like 'resonance-repatterning-program-%-practical-demos-self-study'
order by p.handle, v.title;
commit;
