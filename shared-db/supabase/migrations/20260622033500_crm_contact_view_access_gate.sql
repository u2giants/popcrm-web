-- Keep the browser-safe contact list fast under PostgREST.
--
-- The original CRM contact view was security_invoker, which forced RLS checks
-- through core.contact, core.contact_company, core.company, and crm.department
-- for each paged request. The app loads all contacts in 1,000-row pages; the
-- third page timed out in production and left the Contacts screen empty.
--
-- This view exposes only display-safe fields and gates access explicitly through
-- app.has_app_access('crm'), then runs as the view owner for the underlying join.

create or replace view api.crm_contact_list
with (security_invoker = false) as
select
  ct.id,
  coalesce(ct.full_name, nullif(trim(concat_ws(' ', ct.first_name, ct.last_name)), '')) as name,
  ct.first_name,
  ct.last_name,
  ct.email::text as email,
  ct.phone,
  ct.title as job_title,
  cc.contact_type,
  cc.scope,
  cc.company_id,
  comp.name as company_name,
  comp.customer_status as company_customer_status,
  cc.crm_department_id as department_id,
  d.name as department_name,
  ct.updated_at
from core.contact ct
left join lateral (
  select x.*
  from core.contact_company x
  where x.contact_id = ct.id
  order by x.is_primary desc nulls last, x.id
  limit 1
) cc on true
left join core.company comp on comp.id = cc.company_id
left join crm.department d on d.id = cc.crm_department_id
where app.has_app_access('crm');

grant select on api.crm_contact_list to authenticated;

notify pgrst, 'reload schema';
