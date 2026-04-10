-- =====================================================================
-- Agenda CER4 — Bootstrap do administrador inicial
-- =====================================================================
-- Como rodar (uma única vez, com privilégios de service_role):
--   psql "$SUPABASE_DB_URL" \
--     -v admin_email="'admin@cer4.local'" \
--     -v admin_password="'ChangeMe!2026'" \
--     -v admin_name="'Administrador CER4'" \
--     -f supabase/seed_admin.sql
-- =====================================================================

do $$
declare
  v_email text := :'admin_email';
  v_password text := :'admin_password';
  v_name text := :'admin_name';
  v_user_id uuid;
begin
  -- Cria usuário em auth.users se não existir
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('name', v_name),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', now(), now(), now()
    );
  end if;

  -- Cria registro em admin_users
  insert into public.admin_users (auth_user_id, name, email)
  values (v_user_id, v_name, v_email)
  on conflict (auth_user_id) do update set name = excluded.name, email = excluded.email;
end $$;
