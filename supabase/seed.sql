-- Empresas demo
insert into companies (name, email, plan)
values
  ('Gnerai', 'hola@gnerai.com', 'pro'),
  ('Acme Corp', 'contact@acme.com', 'pro')
on conflict (name) do nothing;

-- Usuarios Auth demo (usa contraseñas cifradas bcrypt)
-- ADVERTENCIA: ejecuta esto solo en entornos locales / staging.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@gnerai.com',
    '$2a$10$7Q8lMFa2uQZLxE3.uVhtceYVwqDAVBBusZT6FJi1dV0t1Ik5dUvdu', -- password: Demo1234
    now(),
    '{"provider":"email"}',
    '{"full_name":"Admin Demo"}'
  )
on conflict (email) do nothing;

insert into profiles (id, company_id, full_name, role)
select '11111111-1111-1111-1111-111111111111', (select id from companies where name = 'Gnerai'), 'Admin Demo', 'company_admin'
on conflict (id) do nothing;
