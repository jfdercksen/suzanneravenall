-- Shayna 6 Oct: the Resonance Repatterning session showed the Rapid Repatterning text.
-- Text from https://suzanneravenall.com/resonance-repatterning-session/ (same as
-- RESONANCE_REPATTERNING_SESSION_DESCRIPTION in infra/scripts/update-product-descriptions.mjs).
begin;
create table if not exists product_description_bak_20261007 as
  select id, handle, description from product where handle = 'resonance-repatterning-session';
update product set description = $rr$Ever wondered why you work so hard at something and it simply does not materialise? A major cause is our subconscious beliefs: mostly unknown to the conscious mind, active in our everyday life, and too often interfering with creating the life that we want and deserve.

Much of what holds us back, on a group or an individual level, comes from subconscious patterns, programming or conditioning that took place early in life, beginning in the womb. These patterns create blockages and restrictions, worry, pain and frustration. Because the subconscious mind runs 95% of our life, it can feel like the same patterns on repeat, preventing the happiness, abundance, performance and fulfilment we want in work, relationships and health.

Resonance Repatterning® identifies these patterns and shifts them. All sessions are completed via Zoom. You bring your entire life experience and the willingness to change. Through biofeedback/applied kinesiology we get to the unconscious processes underlying the issue at hand.$rr$, updated_at = now()
where handle = 'resonance-repatterning-session' and deleted_at is null;
select handle, left(description, 70) as starts_with from product where handle = 'resonance-repatterning-session';
commit;
