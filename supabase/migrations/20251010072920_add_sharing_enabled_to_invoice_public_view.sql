drop view if exists public.public_invoices;

create view public.public_invoices as
select 
    i.id,
    i.invoice_uid,
    i.number,
    c.company_name as client_name,
    i.issue_date,
    i.due_date,
    i.items,          -- keep full JSON array
    i.tax_rate,
    i.status,
    i.sharing_enabled
from public.invoices i
left join public.companies c on c.id = i.client_id;