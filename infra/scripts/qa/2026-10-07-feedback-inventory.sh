#!/usr/bin/env bash
# Read-only checks for Shayna's 6 Oct feedback. Changes nothing.
cd /var/www/suzanneravenall/suzanneravenall/infra

echo "== 1. Group session and RR session products: categories, Thinkific course, formats, stock"
docker compose exec -T postgres psql -U medusa -d medusa -c "
select p.handle,
       p.metadata->>'thinkific_course_id' as course,
       (select string_agg(c.handle, ',') from product_category_product pcp join product_category c on c.id = pcp.product_category_id where pcp.product_id = p.id) as categories,
       v.title as format, v.manage_inventory as managed,
       (select sum(il.stocked_quantity - il.reserved_quantity) from product_variant_inventory_item pvi join inventory_level il on il.inventory_item_id = pvi.inventory_item_id where pvi.variant_id = v.id and il.deleted_at is null) as available
from product p join product_variant v on v.product_id = p.id and v.deleted_at is null
where p.deleted_at is null and (p.handle like '%group%' or p.handle like '%money%' or p.handle like '%career%' or p.handle like '%shedding%' or p.handle like '%love-relationships%' or p.handle = 'resonance-repatterning-session')
order by p.handle, v.title;" </dev/null

echo "== 2. Order #68 lines"
docker compose exec -T postgres psql -U medusa -d medusa -c "
select o.display_id, li.title, li.subtitle, li.product_handle from \"order\" o
join order_item oi on oi.order_id = o.id join order_line_item li on li.id = oi.item_id
where o.display_id in (68) order by 1;" </dev/null

echo "== 3. Why the free (voucher) orders failed"
docker compose logs web --since 30h 2>/dev/null | grep -A4 "checkout/free" | tail -40

echo "== 4. Thinkific courses whose name matches the group sessions"
docker compose exec -T medusa node -e "
const H={Authorization:'Bearer '+process.env.THINKIFIC_API_KEY};
(async()=>{let out=[];for(let page=1;page<=10;page++){const j=await (await fetch('https://api.thinkific.com/api/public/v1/courses?limit=100&page='+page,{headers:H})).json();out=out.concat(j.items||[]);if(!j.meta||!j.meta.pagination||!j.meta.pagination.next_page)break}
const re=/money|career|shedding|weight|love|relationship|boundar|fix others|communication|attraction|confidence|group/i;
for(const c of out) if(re.test(c.name)) console.log(c.id, '|', c.name)})()" </dev/null
