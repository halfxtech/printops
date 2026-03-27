-- PrintOps — Supabase schema + seed data
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ──────────────────────────────────────────────────────────────────────────────
-- Schema
-- ──────────────────────────────────────────────────────────────────────────────

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'print',
  contact text,
  email text,
  location text,
  moq text,
  turnaround text,
  notes text,
  status text default 'active',
  created_at timestamptz default now()
);

create table machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'equipment',
  owned boolean default false,
  cost numeric(10,2) default 0,
  enables text,
  notes text,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('packaging','stationery','marketing','event','digital','signage')),
  is_diy boolean default false,
  supplier_id uuid references suppliers(id) on delete set null,
  machine_id uuid references machines(id) on delete set null,
  cost_price numeric(10,2) default 0,
  sell_price numeric(10,2) default 0,
  moq text,
  turnaround text,
  tags text[] default '{}',
  notes text,
  status text default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_analyses (
  id uuid primary key default gen_random_uuid(),
  health text,
  top_category text,
  potential text,
  priorities jsonb,
  gaps text,
  risks text,
  action text,
  created_at timestamptz default now()
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'other' check (category in ('apparel','paper','packaging','other')),
  size text,
  qty integer default 0,
  unit text default 'pcs' check (unit in ('pcs','reams','rolls','meters','kg')),
  cost_per_unit numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text,
  customer_name text not null,
  customer_company text,
  customer_contact text,
  customer_address text,
  description text,
  status text default 'draft' check (status in ('draft','sent','accepted','declined')),
  notes text,
  total_sell numeric(10,2) default 0,
  total_cost numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists quotes_quote_number_unique
  on quotes (quote_number) where quote_number is not null;

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  qty integer default 1,
  unit_cost numeric(10,2) default 0,
  unit_sell numeric(10,2) default 0,
  supplier_name text,
  supplier_address text,
  supplier_email text,
  supplier_contact text,
  created_at timestamptz default now()
);

-- Enable realtime on products table
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table suppliers;

-- ──────────────────────────────────────────────────────────────────────────────
-- Seed data
-- ──────────────────────────────────────────────────────────────────────────────

insert into suppliers (id, name, type, contact, location, moq, turnaround, notes) values
('11111111-0000-0000-0000-000000000001', 'My main print supplier', 'print', '', 'Selangor', 'As agreed', '2–4 days', 'Add real supplier details here');

insert into machines (id, name, type, owned, cost, enables, notes) values
('22222222-0000-0000-0000-000000000001', 'Design software (Canva / Adobe)', 'software', true, 0, 'All design products', 'Already have'),
('22222222-0000-0000-0000-000000000002', 'Tech / coding skills', 'skill', true, 0, 'QR pages, digital menus, link-in-bio', 'Unique advantage vs other brokers'),
('22222222-0000-0000-0000-000000000003', 'Car + Selangor coverage', 'logistics', true, 0, 'Same-day delivery moat', 'Biggest physical differentiator'),
('22222222-0000-0000-0000-000000000004', 'Laminator A4', 'equipment', false, 65, 'Menu cards, waterproof labels, loyalty cards', 'RM65 — high ROI'),
('22222222-0000-0000-0000-000000000005', 'Cutting mat + craft knife', 'equipment', false, 22, 'Clean die-cut stickers, hang tags', 'Essential for DIY finishing'),
('22222222-0000-0000-0000-000000000006', 'Heat press', 'equipment', false, 800, 'Apparel / tote bag printing', 'Skip for now — outsource instead');

insert into products (name, category, is_diy, supplier_id, cost_price, sell_price, moq, turnaround, tags, notes) values
('Product label stickers','packaging',false,'11111111-0000-0000-0000-000000000001',0.30,1.20,'20pcs','2–3 days','{recurring,day1}','#1 volume product. Home sellers reorder every 4–6 weeks.'),
('Thank-you & packing cards','packaging',false,'11111111-0000-0000-0000-000000000001',0.35,1.50,'20pcs','2–3 days','{recurring,day1}','TikTok unboxing culture drives demand.'),
('E-commerce seal stickers','packaging',false,'11111111-0000-0000-0000-000000000001',0.18,0.80,'50pcs','2–3 days','{recurring,day1}','Every parcel needs a branded seal.'),
('Name cards','stationery',false,'11111111-0000-0000-0000-000000000001',35,100,'50pcs','3–4 days','{day1}','Good cold-call entry product.'),
('QR menu card (F&B)','marketing',true,'11111111-0000-0000-0000-000000000001',4,35,'1pc','1–2 days','{day1,highval}','You code the QR page — pure value-add over other brokers.'),
('Product hang tags','packaging',false,'11111111-0000-0000-0000-000000000001',0.35,1.50,'20pcs','2–3 days','{recurring,day1}','Boutique clothing sellers are key targets.'),
('Flyers & leaflets','marketing',false,'11111111-0000-0000-0000-000000000001',0.55,1.80,'50pcs','2–3 days','{day1}','Design skill is your differentiator.'),
('Wedding invitation cards','event',false,'11111111-0000-0000-0000-000000000001',1.50,6.00,'30pcs','4–5 days','{highval,seasonal}','One wedding = RM200–600 order.'),
('Event invitations','event',false,'11111111-0000-0000-0000-000000000001',0.80,4.50,'20pcs','2–3 days','{highval,seasonal}','Year-round in Malaysian culture.'),
('Raya / open house cards','event',false,'11111111-0000-0000-0000-000000000001',0.70,3.50,'30pcs','2–3 days','{seasonal,highval}','Big Jan–Mar peak. Start orders 6 weeks before Raya.'),
('Doorgift sticker labels','packaging',false,'11111111-0000-0000-0000-000000000001',0.20,0.90,'50pcs','2–3 days','{seasonal,recurring}','Always ordered alongside event invites.'),
('Certificates & awards','stationery',false,'11111111-0000-0000-0000-000000000001',3.50,18,'1pc','1–2 days','{day1}','Schools, clubs, corporate events.'),
('Loyalty punch cards','marketing',false,'11111111-0000-0000-0000-000000000001',0.28,1.20,'30pcs','2–3 days','{recurring,day1}','Cafes, nail salons, laundry reorder every 3–4 months.'),
('Full brand starter kit','digital',true,'11111111-0000-0000-0000-000000000001',75,320,'1 kit','5–7 days','{highval,day1}','Logo + cards + labels + IG covers bundle.'),
('Social media templates (Canva)','digital',true,null,0,120,'1 set','2–3 days','{day1,recurring}','Zero cost, 90%+ margin. Pure design.'),
('Digital price list / menu PDF','digital',true,null,0,80,'1 doc','1 day','{day1,recurring}','Replace blurry WA menus with clean branded PDFs.'),
('Bunting / banner (outsourced)','signage',false,null,28,90,'1pc','2–3 days','{highval,seasonal}','You design, wide-format supplier prints.'),
('Tote bag / apparel (outsourced)','signage',false,null,13,40,'5pcs','3–5 days','{highval,seasonal}','Corporate gifts, school events. Outsource.');
