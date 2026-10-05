create or replace function public.reserve_and_queue_material(p_user_id uuid,p_attempt_id uuid,p_page_count integer)
returns table(material_id uuid,attempt_id uuid,plan_type text,queue_status text)
language plpgsql security definer set search_path='' as $$
declare v_attempt public.processing_attempts%rowtype; v_profile public.profiles%rowtype; v_e public.plan_entitlements%rowtype;
begin
  select * into v_attempt from public.processing_attempts where id=p_attempt_id and user_id=p_user_id for update;
  if v_attempt.id is null then raise exception 'ATTEMPT_NOT_FOUND' using errcode='P0002'; end if;
  if v_attempt.status in ('QUEUED','RUNNING','COMPLETED') then
    select * into v_profile from public.profiles where id=p_user_id;
    return query select v_attempt.material_id,v_attempt.id,v_profile.plan_type,v_attempt.status::text; return;
  end if;
  if v_attempt.status<>'REGISTERED' then raise exception 'ATTEMPT_NOT_QUEUEABLE' using errcode='23514'; end if;
  select * into v_profile from public.profiles where id=p_user_id for update;
  select e.* into v_e from public.plan_entitlements e where e.plan_type=case when v_profile.plan_type='pro' then 'pro' else 'free' end;
  if p_page_count<=0 or p_page_count>v_e.max_pages_per_document then raise exception 'DOCUMENT_PAGE_LIMIT' using errcode='P0001'; end if;
  perform private.reserve_usage(p_user_id,'generation',1,p_attempt_id::text||':generation',p_attempt_id,jsonb_build_object('materialId',v_attempt.material_id));
  perform private.reserve_usage(p_user_id,'pages',p_page_count,p_attempt_id::text||':pages',p_attempt_id,jsonb_build_object('materialId',v_attempt.material_id));
  update public.processing_attempts set status='QUEUED',page_count=p_page_count,reserved_pages=p_page_count,generation_reserved=true,heartbeat_at=now(),failure_code=null,failure_message=null where id=p_attempt_id;
  update public.materials set status='QUEUED',page_count=p_page_count,failure_code=null,failure_message=null where id=v_attempt.material_id;
  update public.profiles set generation_count=generation_count+1 where id=p_user_id;
  update public.user_usage set weekly_pages_used=weekly_pages_used+p_page_count where user_id=p_user_id;
  return query select v_attempt.material_id,v_attempt.id,v_profile.plan_type,'QUEUED'::text;
end $$;

revoke all on function public.reserve_and_queue_material(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.reserve_and_queue_material(uuid,uuid,integer) to service_role;
