create extension if not exists pgcrypto;
create extension if not exists citext;

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public,pg_temp
as $$ select exists(select 1 from public.admin_profiles a where a.user_id=auth.uid() and a.is_active=true) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.site_settings(
 id bigint generated always as identity primary key,
 key text unique not null,
 value jsonb not null default '{}'::jsonb,
 is_public boolean not null default true,
 updated_at timestamptz not null default now()
);

create table public.social_links(
 id bigint generated always as identity primary key,
 label text not null,url text not null,icon text,sort_order int not null default 0,is_active boolean not null default true
);

create table public.subscribers(
 id uuid primary key default gen_random_uuid(),
 email citext unique not null,
 source text not null default 'website',
 status text not null default 'active' check(status in('active','unsubscribed')),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table public.posts(
 id uuid primary key default gen_random_uuid(),
 slug text unique not null,
 title text not null,
 excerpt text not null default '',
 body text not null default '',
 cover_url text,
 status text not null default 'draft' check(status in('draft','published','archived')),
 published_at timestamptz,
 seo_title text,seo_description text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.products(
 id uuid primary key default gen_random_uuid(),
 slug text unique not null,
 name text not null,
 short_description text not null default '',
 description text not null default '',
 type text not null default 'مادة مجانية',
 reward_ads_required int not null default 5 check(reward_ads_required between 1 and 50),
 download_url text,
 cover_url text,
 status text not null default 'draft' check(status in('draft','published','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.services(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 description text not null default '',
 price_text text,
 sort_order int not null default 0,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);

create table public.sponsor_requests(
 id uuid primary key default gen_random_uuid(),
 company text not null,name text not null,email citext not null,budget text,type text not null,message text not null,
 status text not null default 'new' check(status in('new','contacted','accepted','rejected','closed')),
 created_at timestamptz not null default now()
);

create table public.service_requests(
 id uuid primary key default gen_random_uuid(),
 name text not null,email citext not null,service text not null,budget text,message text not null,
 status text not null default 'new' check(status in('new','contacted','accepted','rejected','closed')),
 created_at timestamptz not null default now()
);

create table public.contact_messages(
 id uuid primary key default gen_random_uuid(),
 name text not null,email citext not null,subject text not null,message text not null,
 status text not null default 'new' check(status in('new','read','closed')),
 created_at timestamptz not null default now()
);

create table public.analytics_events(
 id bigint generated always as identity primary key,
 event_name text not null,path text,referrer text,session_id text,metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.subscribers enable row level security;
alter table public.posts enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.sponsor_requests enable row level security;
alter table public.service_requests enable row level security;
alter table public.contact_messages enable row level security;
alter table public.analytics_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.site_settings,public.social_links,public.posts,public.products,public.services to anon,authenticated;
grant select,insert,update,delete on public.admin_profiles,public.site_settings,public.social_links,public.subscribers,public.posts,public.products,public.services,public.sponsor_requests,public.service_requests,public.contact_messages,public.analytics_events to authenticated;

create policy settings_public_read on public.site_settings for select to anon,authenticated using(is_public=true);
create policy socials_public_read on public.social_links for select to anon,authenticated using(is_active=true);
create policy posts_public_read on public.posts for select to anon,authenticated using(status='published');
create policy products_public_read on public.products for select to anon,authenticated using(status='published');
create policy services_public_read on public.services for select to anon,authenticated using(is_active=true);

do $$
declare t text;
begin
  foreach t in array array['admin_profiles','site_settings','social_links','subscribers','posts','products','services','sponsor_requests','service_requests','contact_messages','analytics_events']
  loop
    execute format('create policy %I_admin_select on public.%I for select to authenticated using(public.is_admin())',t,t);
    execute format('create policy %I_admin_insert on public.%I for insert to authenticated with check(public.is_admin())',t,t);
    execute format('create policy %I_admin_update on public.%I for update to authenticated using(public.is_admin()) with check(public.is_admin())',t,t);
    execute format('create policy %I_admin_delete on public.%I for delete to authenticated using(public.is_admin())',t,t);
  end loop;
end $$;

create or replace function public.subscribe_public(p_email text,p_source text default 'website')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_email citext;
begin
 v_email:=lower(trim(p_email));
 if v_email is null or length(v_email)>254 or v_email::text !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
 insert into public.subscribers(email,source,status,consent_at) values(v_email,left(coalesce(p_source,'website'),80),'active',now())
 on conflict(email) do update set status='active',source=excluded.source,consent_at=now();
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.submit_sponsor_request_public(p_company text,p_name text,p_email text,p_budget text,p_type text,p_message text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.sponsor_requests(company,name,email,budget,type,message)
 values(left(trim(p_company),160),left(trim(p_name),120),lower(trim(p_email)),left(p_budget,120),left(trim(p_type),120),left(trim(p_message),4000));
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.submit_service_request_public(p_name text,p_email text,p_service text,p_budget text,p_message text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.service_requests(name,email,service,budget,message)
 values(left(trim(p_name),120),lower(trim(p_email)),left(trim(p_service),160),left(p_budget,120),left(trim(p_message),4000));
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.submit_contact_public(p_name text,p_email text,p_subject text,p_message text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.contact_messages(name,email,subject,message)
 values(left(trim(p_name),120),lower(trim(p_email)),left(trim(p_subject),200),left(trim(p_message),4000));
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.track_event_public(p_event_name text,p_path text,p_referrer text,p_session_id text,p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if length(coalesce(p_event_name,'')) between 1 and 80 then
  insert into public.analytics_events(event_name,path,referrer,session_id,metadata)
  values(left(p_event_name,80),left(p_path,500),left(p_referrer,1000),left(p_session_id,120),coalesce(p_metadata,'{}'::jsonb));
 end if;
end $$;

revoke all on function public.subscribe_public(text,text) from public;
revoke all on function public.submit_sponsor_request_public(text,text,text,text,text,text) from public;
revoke all on function public.submit_service_request_public(text,text,text,text,text) from public;
revoke all on function public.submit_contact_public(text,text,text,text) from public;
revoke all on function public.track_event_public(text,text,text,text,jsonb) from public;

grant execute on function public.subscribe_public(text,text) to anon,authenticated;
grant execute on function public.submit_sponsor_request_public(text,text,text,text,text,text) to anon,authenticated;
grant execute on function public.submit_service_request_public(text,text,text,text,text) to anon,authenticated;
grant execute on function public.submit_contact_public(text,text,text,text) to anon,authenticated;
grant execute on function public.track_event_public(text,text,text,text,jsonb) to anon,authenticated;
