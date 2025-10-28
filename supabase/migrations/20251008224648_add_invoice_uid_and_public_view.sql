-- 1. Enable pgcrypto for UUID generation
create extension if not exists pgcrypto;

-- 2. Add invoice_uid column
alter table public.invoices
add column invoice_uid text
    not null
    unique
    default gen_random_uuid()::text;

-- 3. Create a view for public invoices (only safe fields)
create or replace view public.public_invoices as
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
    i.notes
from public.invoices i
left join public.companies c on c.id = i.client_id;

