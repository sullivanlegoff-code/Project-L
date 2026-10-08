-- Apply in a NEW Supabase project SQL editor. No game/user data in this file.
-- Owners come only from the verified JWT; clients cannot write tables directly.
begin;
create schema if not exists prairie_private;
revoke all on schema prairie_private from public, anon;
grant usage on schema prairie_private to authenticated;

create table public.prairie_saves (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null,
 format integer not null check(format >= 4),
 revision bigint not null check(revision > 0 and revision <= 9007199254740991),
 saved_at timestamptz not null default clock_timestamp(),
 operation_id uuid not null
);
create table public.prairie_history (
 id uuid not null default gen_random_uuid(),
 sequence bigint generated always as identity,
 owner_id uuid not null references auth.users(id) on delete cascade,
 revision bigint not null,
 state jsonb not null,
 saved_at timestamptz not null,
 kind text not null check(kind in ('revision','checkpoint')),
 reason text not null check(reason in ('sync','initial','import','replace','restore','restart')),
 primary key(owner_id,id)
);
create index prairie_history_owner_date on public.prairie_history(owner_id,saved_at desc);
create table prairie_private.operations (
 owner_id uuid not null references auth.users(id) on delete cascade,
 operation_id uuid not null,
 fingerprint text not null,
 revision bigint not null,
 saved_at timestamptz not null,
 primary key(owner_id,operation_id)
);
create table prairie_private.retention (
 singleton boolean primary key default true check(singleton),
 revisions integer not null check(revisions between 1 and 100),
 active_days integer not null check(active_days between 1 and 30),
 checkpoints integer not null check(checkpoints between 1 and 100),
 operations integer not null check(operations between 1 and 256)
);
insert into prairie_private.retention values(true,20,7,20,64);

alter table public.prairie_saves enable row level security;
alter table public.prairie_history enable row level security;
alter table prairie_private.operations enable row level security;
alter table prairie_private.retention enable row level security;
revoke all on public.prairie_saves, public.prairie_history from public, anon, authenticated;
revoke all on prairie_private.operations,prairie_private.retention from public, anon, authenticated;
grant select on public.prairie_saves,public.prairie_history to authenticated;
create policy own_save_read on public.prairie_saves for select to authenticated using(owner_id=(select auth.uid()));
create policy own_history_read on public.prairie_history for select to authenticated using(owner_id=(select auth.uid()));

-- Server structure/limits, plus full semantic validation in the game before sending
-- and after reading. Unsupported/corrupt states are quarantined, never overwritten.
create function prairie_private.valid_v4(s jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; b jsonb; r jsonb; n numeric; m jsonb; d jsonb;
begin
 if s is null or coalesce(jsonb_typeof(s),'null')<>'object' or s->>'version' is distinct from '4' or octet_length(s::text)>1000000 then return false; end if;
 if s - array['version','missions','lastSimulatedAt','nextId','hearts','nextHeartGiftAt','pattes','grass','expanded','secondExpanded','buildings','rabbits','discovered','pityFailures'] <> '{}'::jsonb then return false; end if;
 foreach k in array array['lastSimulatedAt','nextId','hearts','nextHeartGiftAt','pattes','grass','pityFailures'] loop
  if coalesce(jsonb_typeof(s->k),'null')<>'number' then return false; end if;
  n:=(s->>k)::numeric;if n<0 or n>9007199254740991 or n<>trunc(n) then return false;end if;
 end loop;
 if (s->>'nextId')::numeric<1 or (s->>'pityFailures')::numeric>9 then return false;end if;
 if coalesce(jsonb_typeof(s->'expanded'),'null')<>'boolean' or coalesce(jsonb_typeof(s->'secondExpanded'),'null')<>'boolean' or coalesce(jsonb_typeof(s->'missions'),'null')<>'object' then return false; end if;
 m:=s->'missions';d:=m->'daily';
 if m-array['completed','claimed','daily']<>'{}'::jsonb or coalesce(jsonb_typeof(m->'completed'),'null')<>'array' or coalesce(jsonb_typeof(m->'claimed'),'null')<>'array' or coalesce(jsonb_typeof(d),'null')<>'object' then return false;end if;
 if d-array['referenceAt','cycleIndex','progress','claimed','bonusClaimed']<>'{}'::jsonb or coalesce(jsonb_typeof(d->'claimed'),'null')<>'array' or coalesce(jsonb_typeof(d->'bonusClaimed'),'null')<>'boolean' or coalesce(jsonb_typeof(d->'progress'),'null')<>'object' or (d->'progress')-array['collect-pattes','collect-grass','gain-affection']<>'{}'::jsonb then return false;end if;
 foreach k in array array['referenceAt','cycleIndex'] loop
  if coalesce(jsonb_typeof(d->k),'null')<>'number' then return false;end if;
  n:=(d->>k)::numeric;if n<0 or n>9007199254740991 or n<>trunc(n) then return false;end if;
 end loop;
 foreach k in array array['collect-pattes','collect-grass','gain-affection'] loop
  if coalesce(jsonb_typeof(d->'progress'->k),'null')<>'number' then return false;end if;
  n:=(d->'progress'->>k)::numeric;if n<0 or n>9007199254740991 or n<>trunc(n) then return false;end if;
 end loop;
 if (s->>'secondExpanded')::boolean and not (s->>'expanded')::boolean then return false;end if;
 if coalesce(jsonb_typeof(s->'buildings'),'null')<>'array' or coalesce(jsonb_typeof(s->'rabbits'),'null')<>'array' or coalesce(jsonb_typeof(s->'discovered'),'null')<>'array' then return false;end if;
 if jsonb_array_length(s->'buildings')>18 or jsonb_array_length(s->'rabbits')>126 or jsonb_array_length(s->'discovered')>11 then return false; end if;
 for b in select value from jsonb_array_elements(s->'buildings') loop
  if coalesce(jsonb_typeof(b),'null')<>'object' or coalesce(b->>'id','')!~'^building-[1-9][0-9]{0,15}$' or coalesce(b->>'kind','') not in ('enclosure','farm','nest','nursery') then return false;end if;
  if b-array['id','kind','x','y','incomeUnits','order','breeding','baby','habitat']<>'{}'::jsonb or not (b ?& array['order','breeding','baby','habitat']) then return false;end if;
  foreach k in array array['x','y','incomeUnits'] loop
   if coalesce(jsonb_typeof(b->k),'null')<>'number' or (b->>k)::numeric<0 or (b->>k)::numeric>9007199254740991 or (b->>k)::numeric<>trunc((b->>k)::numeric) then return false;end if;
  end loop;
  if (b->>'x')::numeric>=(case when (s->>'secondExpanded')::boolean then 9 when (s->>'expanded')::boolean then 6 else 3 end) or (b->>'y')::numeric>=2 then return false;end if;
  if b->>'kind'='enclosure' and (coalesce(jsonb_typeof(b->'habitat'),'null')<>'object' or coalesce(b->'habitat'->>'type','') not in ('universal','paille','neige','terre','feu','metal','vol') or coalesce(b->'habitat'->>'level','') not in ('1','2','3')) then return false;end if;
 end loop;
 for r in select value from jsonb_array_elements(s->'rabbits') loop
  if coalesce(jsonb_typeof(r),'null')<>'object' or coalesce(r->>'id','')!~'^(rabbit|birth)-[1-9][0-9]{0,15}$' or coalesce(r->>'species','') not in ('paille','neige','terre','brumelin','mottelin','feu','belier-gris','volant','lunettes','perroquet','feu-glace') then return false;end if;
  if coalesce(jsonb_typeof(r->'affection'),'null')<>'number' or (r->>'affection')::numeric<1 or (r->>'affection')::numeric>20 or (r->>'affection')::numeric<>trunc((r->>'affection')::numeric) then return false;end if;
  if r-array['id','species','affection','enclosureId']<>'{}'::jsonb then return false;end if;
  if not exists(select 1 from jsonb_array_elements(s->'buildings') h where h->>'id'=r->>'enclosureId' and h->>'kind'='enclosure') then return false;end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function prairie_private.valid_v4(jsonb) from public,anon,authenticated;

create function prairie_private.commit_game(p_owner uuid,p_expected bigint,p_operation uuid,p_state jsonb,p_reason text,p_checkpoints jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); current public.prairie_saves; op prairie_private.operations; stamp timestamptz; rev bigint; fingerprint text; point jsonb; limits prairie_private.retention;
begin
 if uid is null or uid is distinct from p_owner then raise exception using errcode='42501',message='Authenticated owner required'; end if;
 if p_operation is null or p_expected is null or p_expected<0 or p_expected>=9007199254740991 or p_reason is null or p_reason not in ('sync','initial','import','replace','restore','restart') then return jsonb_build_object('status','invalid');end if;
 if not prairie_private.valid_v4(p_state) or coalesce(jsonb_typeof(p_checkpoints),'null')<>'array' or jsonb_array_length(p_checkpoints)>20 or octet_length(p_checkpoints::text)>4000000 then return jsonb_build_object('status','invalid');end if;
 for point in select value from jsonb_array_elements(p_checkpoints) loop
  if not prairie_private.valid_v4(point->'state') or coalesce(point->>'reason','') not in ('import','replace','restore','restart') or coalesce(point->>'id','')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return jsonb_build_object('status','invalid');end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into current from public.prairie_saves where owner_id=uid for update;
 -- A stale client must not overwrite a future format, even by replaying an old op.
 if found and current.format<>4 then return jsonb_build_object('status','unsupported');end if;
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('expected',p_expected,'state',p_state,'reason',p_reason,'points',p_checkpoints)::text,'UTF8')),'hex');
 select * into op from prairie_private.operations where owner_id=uid and operation_id=p_operation;
 if found then
  if op.fingerprint<>fingerprint then return jsonb_build_object('status','invalid_operation');end if;
  return jsonb_build_object('status','ok','owner_id',uid,'revision',op.revision,'saved_at',op.saved_at,'operation_id',p_operation);
 end if;
 if coalesce(current.revision,0)<>p_expected then return jsonb_build_object('status','conflict','remote',to_jsonb(current));end if;
 -- A repeated checkpoint ID must refer to the same immutable backup.
 for point in select value from jsonb_array_elements(p_checkpoints) loop
  if exists(select 1 from public.prairie_history where owner_id=uid and id=(point->>'id')::uuid and (kind<>'checkpoint' or state<>point->'state' or reason<>point->>'reason')) then return jsonb_build_object('status','invalid_operation');end if;
 end loop;
 stamp:=clock_timestamp();rev:=p_expected+1;
 for point in select value from jsonb_array_elements(p_checkpoints) loop
  insert into public.prairie_history(id,owner_id,revision,state,saved_at,kind,reason)
  values((point->>'id')::uuid,uid,p_expected,point->'state',stamp,'checkpoint',point->>'reason') on conflict(owner_id,id) do nothing;
 end loop;
 insert into public.prairie_history(owner_id,revision,state,saved_at,kind,reason) values(uid,rev,p_state,stamp,'revision',p_reason);
 insert into public.prairie_saves(owner_id,state,format,revision,saved_at,operation_id) values(uid,p_state,4,rev,stamp,p_operation)
 on conflict(owner_id) do update set state=excluded.state,format=4,revision=excluded.revision,saved_at=excluded.saved_at,operation_id=excluded.operation_id;
 insert into prairie_private.operations values(uid,p_operation,fingerprint,rev,stamp);
 select * into limits from prairie_private.retention where singleton;
 -- Union: newest N revisions, first point of each of last D active UTC dates,
 -- and newest C explicitly requested checkpoints. At defaults: <=47 points/user.
 delete from public.prairie_history h where h.owner_id=uid and h.id not in (
  (select id from public.prairie_history where owner_id=uid and kind='revision' order by revision desc limit limits.revisions)
  union
  (select id from (select distinct on ((saved_at at time zone 'UTC')::date) id,saved_at from public.prairie_history where owner_id=uid and kind='revision' order by (saved_at at time zone 'UTC')::date desc,revision asc) days order by saved_at desc limit limits.active_days)
  union
  (select id from public.prairie_history where owner_id=uid and kind='checkpoint' order by saved_at desc,sequence desc limit limits.checkpoints)
 );
 delete from prairie_private.operations where owner_id=uid and operation_id not in (select operation_id from prairie_private.operations where owner_id=uid order by revision desc limit limits.operations);
 return jsonb_build_object('status','ok','owner_id',uid,'revision',rev,'saved_at',stamp,'operation_id',p_operation);
end $$;
revoke all on function prairie_private.commit_game(uuid,bigint,uuid,jsonb,text,jsonb) from public,anon;
grant execute on function prairie_private.commit_game(uuid,bigint,uuid,jsonb,text,jsonb) to authenticated;
create function public.prairie_commit(p_owner uuid,p_expected bigint,p_operation uuid,p_state jsonb,p_reason text default 'sync',p_checkpoints jsonb default '[]'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$select prairie_private.commit_game(p_owner,p_expected,p_operation,p_state,p_reason,p_checkpoints)$$;
revoke all on function public.prairie_commit(uuid,bigint,uuid,jsonb,text,jsonb) from public,anon;
grant execute on function public.prairie_commit(uuid,bigint,uuid,jsonb,text,jsonb) to authenticated;
commit;
