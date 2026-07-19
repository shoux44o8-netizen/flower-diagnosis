-- =========================================================
-- Flower Diagnosis
-- Supabase Recovery SQL
-- Version: v1.0.0
--
-- 用途：
-- 新しく作成した空のSupabaseプロジェクトに、
-- 花診断・抽選システムのデータベース構造を復元する。
--
-- 注意：
-- 現在稼働中の本番Supabaseでは実行しないこと。
-- lottery_events等の初期データはCSVから別途復元する。
-- =========================================================

begin;

-- =========================================================
-- 1. Extension
-- gen_random_uuid()を使用するために必要
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- 2. Tables
-- =========================================================

create table public.lottery_events (
  id uuid
    not null
    default gen_random_uuid(),

  name text
    not null,

  is_open boolean
    not null
    default true,

  draw_finished boolean
    not null
    default false,

  max_winners integer
    not null
    default 3,

  created_at timestamp with time zone
    default now(),

  event_code text,

  starts_at timestamp with time zone,

  ends_at timestamp with time zone,

  closed_at timestamp with time zone,

  drawn_at timestamp with time zone,

  constraint lottery_events_pkey
    primary key (id)
);


create table public.participants (
  id uuid
    not null
    default gen_random_uuid(),

  event_id uuid,

  guest_name text,

  device_id text
    not null,

  flower_result text
    not null,

  lottery_status text
    default 'pending'::text,

  winner_number integer,

  created_at timestamp with time zone
    default now(),

  constraint participants_pkey
    primary key (id),

  constraint participants_event_id_fkey
    foreign key (event_id)
    references public.lottery_events(id)
    on delete cascade
);


-- =========================================================
-- 3. Unique Indexes
-- =========================================================

create unique index lottery_events_event_code_unique
  on public.lottery_events
  using btree (event_code);


create unique index participants_event_device_unique
  on public.participants
  using btree (event_id, device_id);


-- =========================================================
-- 4. Row Level Security
-- =========================================================

alter table public.lottery_events
  enable row level security;


alter table public.participants
  enable row level security;


-- =========================================================
-- 5. RLS Policies
-- =========================================================

create policy "Guests can read lottery event"
on public.lottery_events
as permissive
for select
to anon
using (true);


create policy "Allow public participant registration"
on public.participants
as permissive
for insert
to anon
with check (
  exists (
    select 1
    from public.lottery_events as event
    where event.id = participants.event_id
      and event.is_open = true
      and event.draw_finished = false
      and now() >= event.starts_at
      and now() < event.ends_at
  )
  and lottery_status = any (
    array[
      'pending'::text,
      'not_selected'::text
    ]
  )
  and winner_number is null
);


-- =========================================================
-- 6. Lottery RPC
-- =========================================================

create or replace function public.draw_golden_winners(
  target_event_code text
)
returns table (
  participant_id uuid,
  guest_name text,
  winner_number integer
)
language plpgsql
security definer
set search_path to ''
as $function$

declare
  target_event_id uuid;
  target_max_winners integer;
  already_finished boolean;

begin

  /*
    対象イベントをロックし、
    同時に抽選処理が走ることを防ぐ。
  */
  select
    le.id,
    le.max_winners,
    le.draw_finished
  into
    target_event_id,
    target_max_winners,
    already_finished
  from public.lottery_events as le
  where le.event_code = target_event_code
  for update;


  if target_event_id is null then
    raise exception
      'Lottery event was not found.';
  end if;


  /*
    抽選済みの場合は、
    既存の当選者をそのまま返す。
  */
  if already_finished then

    return query
    select
      p.id,
      p.guest_name,
      p.winner_number
    from public.participants as p
    where p.event_id = target_event_id
      and p.lottery_status = 'winner'
    order by p.winner_number;

    return;

  end if;


  /*
    抽選開始時点で受付を終了する。
  */
  update public.lottery_events
  set
    is_open = false,
    closed_at = now()
  where id = target_event_id;


  /*
    対象イベントの未抽選参加者を
    一度not_selectedへ変更する。
  */
  update public.participants
  set
    lottery_status = 'not_selected',
    winner_number = null
  where event_id = target_event_id
    and lottery_status = 'pending';


  /*
    サンダーソニアの参加者から
    max_winnersの人数まで無作為抽選する。
  */
  with selected_winners as (

    select
      p.id,
      row_number() over (
        order by random()
      )::integer as selected_number

    from public.participants as p

    where p.event_id = target_event_id
      and p.flower_result = 'sandersonia'

    order by random()

    limit target_max_winners

  )

  update public.participants as p
  set
    lottery_status = 'winner',
    winner_number =
      selected_winners.selected_number
  from selected_winners
  where p.id = selected_winners.id;


  /*
    抽選完了状態を固定する。
  */
  update public.lottery_events
  set
    draw_finished = true,
    drawn_at = now()
  where id = target_event_id;


  /*
    確定した当選者を返す。
  */
  return query
  select
    p.id,
    p.guest_name,
    p.winner_number
  from public.participants as p
  where p.event_id = target_event_id
    and p.lottery_status = 'winner'
  order by p.winner_number;

end;

$function$;


-- =========================================================
-- 7. Permissions
-- =========================================================

-- 不要な公開権限を一度取り除く
revoke all
on table public.lottery_events
from anon, authenticated;


revoke all
on table public.participants
from anon, authenticated;


revoke all
on function public.draw_golden_winners(text)
from public, anon, authenticated;


-- ゲストに必要な最小限の権限
grant select
on table public.lottery_events
to anon;


grant insert
on table public.participants
to anon;


-- 抽選RPCはサーバー側のservice_roleだけが実行可能
grant execute
on function public.draw_golden_winners(text)
to service_role;


-- service_roleへ管理処理に必要な権限を付与
grant select, insert, update, delete
on table public.lottery_events
to service_role;


grant select, insert, update, delete
on table public.participants
to service_role;


commit;


-- =========================================================
-- 復元後に行うこと
-- =========================================================
--
-- 1. lottery_events.csvをインポート
-- 2. 必要に応じてparticipants.csvをインポート
-- 3. Vercelへ環境変数を設定
-- 4. ゲスト診断からテスト登録
-- 5. リハーサル管理画面から抽選テスト
--
-- =========================================================
