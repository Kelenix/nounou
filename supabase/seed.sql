-- ============================================================================
-- Seed (données de départ) — exécuté par `supabase db reset`.
-- Tarifs configurables + catégories de services + comptes de démonstration.
-- ============================================================================

-- ---------- Paramètres / tarifs (modifiables en admin) ---------------------
insert into public.settings (key, value) values
  ('prix_activation_candidate', '1000'::jsonb),
  ('prix_premium_employeur', '2000'::jsonb),
  ('devise', '"FCFA"'::jsonb),
  ('services', '["menage","cuisine","garde_enfants","lessive","repassage","entretien","assistance_personnes_agees","autre"]'::jsonb)
on conflict (key) do nothing;

-- ---------- Comptes de démonstration ---------------------------------------
-- Créés directement dans auth.users pour le dev local. Le trigger
-- `handle_new_user` crée les profils ; on complète ensuite rôle/nom.
-- Numéros de test : voir supabase/config.toml [auth.sms.test_otp] (code 123456).
do $$
declare
  admin_id  uuid := '00000000-0000-0000-0000-0000000000a1';
  emp_id    uuid := '00000000-0000-0000-0000-0000000000e1';
  cand_id   uuid := '00000000-0000-0000-0000-0000000000c1';
begin
  -- IMPORTANT : GoTrue stocke le téléphone SANS le « + » ; et les colonnes de tokens
  -- doivent valoir '' (pas NULL), sinon GoTrue échoue (« Database error finding user »).
  insert into auth.users (
    instance_id, id, aud, role, phone, phone_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', '2250700000001', now(),
     '', '', '', '', '', '', '', '',
     '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now()),
    ('00000000-0000-0000-0000-000000000000', emp_id, 'authenticated', 'authenticated', '2250700000002', now(),
     '', '', '', '', '', '', '', '',
     '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now()),
    ('00000000-0000-0000-0000-000000000000', cand_id, 'authenticated', 'authenticated', '2250700000003', now(),
     '', '', '', '', '', '', '', '',
     '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  -- Identités « phone » attendues par GoTrue (sinon un nouveau compte est créé au login).
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), admin_id, jsonb_build_object('sub', admin_id::text, 'phone', '2250700000001'), 'phone', admin_id::text, now(), now(), now()),
    (gen_random_uuid(), emp_id,   jsonb_build_object('sub', emp_id::text,   'phone', '2250700000002'), 'phone', emp_id::text,   now(), now(), now()),
    (gen_random_uuid(), cand_id,  jsonb_build_object('sub', cand_id::text,  'phone', '2250700000003'), 'phone', cand_id::text,  now(), now(), now())
  on conflict (provider, provider_id) do nothing;

  update public.profiles set role='admin', is_super_admin=true, nom='Admin', prenom='Nounou',
         ville='Abidjan', commune='Cocody', verification_level='verified' where id=admin_id;
  update public.profiles set role='employer', nom='Kouassi', prenom='Awa', ville='Abidjan',
         commune='Yopougon' where id=emp_id;
  update public.profiles set role='candidate', nom='Traoré', prenom='Fatou', ville='Abidjan',
         commune='Abobo', photo_url='/demo/nounou-1.jpg' where id=cand_id;

  insert into public.employer_profiles (user_id, type_besoin, description, nb_personnes_foyer, is_premium)
  values (emp_id, 'Garde d''enfants', 'Famille de 4 personnes à Yopougon.', 4, false)
  on conflict (user_id) do nothing;

  insert into public.candidate_profiles (user_id, services, experience_annees, competences, disponibilite, description, temps_plein, salaire_souhaite, is_active_paid)
  values (cand_id, array['garde_enfants','menage']::public.service_type[], 3,
          array['Premiers secours','Cuisine ivoirienne','Éveil des enfants'], 'Disponible immédiatement',
          'Expérimentée, sérieuse et ponctuelle. J''adore m''occuper des enfants et je veille à leur sécurité et leur épanouissement.',
          true, 60000, true)
  on conflict (user_id) do nothing;

  insert into public.offers (employer_id, titre, type_service, description, ville, commune, quartier, salaire, status)
  values
    (emp_id, 'Nounou pour 2 enfants', 'garde_enfants',
     'Recherche nounou de confiance pour 2 enfants (3 et 5 ans).',
     'Abidjan', 'Yopougon', 'Selmer', 70000, 'active'),
    (emp_id, 'Aide-ménagère 3x/semaine', 'menage',
     'Ménage et repassage, 3 fois par semaine en matinée.',
     'Abidjan', 'Yopougon', null, 50000, 'active'),
    (emp_id, 'Cuisinière à domicile', 'cuisine',
     'Préparation des repas midi et soir pour une famille de 4.',
     'Abidjan', 'Cocody', null, 90000, 'active')
  on conflict do nothing;
end $$;

-- ---------- Prestataires (nounous) supplémentaires pour le catalogue --------
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('00000000-0000-0000-0000-0000000000c2'::uuid, '2250700000004', 'Diabaté', 'Awa',      'Abidjan', 'Cocody',   array['menage','cuisine']::public.service_type[], 5, 'Cuisinière et femme de ménage expérimentée, je prépare de bons petits plats et je tiens la maison impeccable.', true, 80000, array['Cuisine ivoirienne','Ménage complet','Repassage'], 'En semaine, matinées', '/demo/nounou-2.jpg'),
      ('00000000-0000-0000-0000-0000000000c3'::uuid, '2250700000005', 'Koné',    'Mariam',   'Abidjan', 'Marcory',  array['garde_enfants','assistance_personnes_agees']::public.service_type[], 7, 'Douce et patiente, spécialisée dans la petite enfance et l''accompagnement des personnes âgées.', false, 65000, array['Petite enfance','Accompagnement seniors','Premiers secours'], 'Temps partiel, flexible', '/demo/nounou-3.jpg'),
      ('00000000-0000-0000-0000-0000000000c4'::uuid, '2250700000006', 'Yao',     'Grace',    'Bouaké',  'Koko',     array['menage','lessive','repassage']::public.service_type[], 2, 'Rapide, rigoureuse et fiable pour l''entretien de la maison et du linge.', true, 45000, array['Ménage','Lessive','Repassage'], 'Disponible immédiatement', '/demo/nounou-4.jpg'),
      ('00000000-0000-0000-0000-0000000000c5'::uuid, '2250700000007', 'Bamba',   'Aminata',  'Abidjan', 'Yopougon', array['garde_enfants']::public.service_type[], 4, 'Nounou diplômée, j''adore les enfants et je propose des activités d''éveil adaptées à leur âge.', true, 70000, array['Éveil des enfants','Aide aux devoirs','Premiers secours'], 'Temps plein, du lundi au samedi', '/demo/nounou-5.jpg')
    ) as t(id, phone, nom, prenom, ville, commune, services, exp, descr, tp, salaire, competences, dispo, photo)
  loop
    insert into auth.users (
      instance_id, id, aud, role, phone, phone_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated', r.phone, now(),
            '', '', '', '', '', '', '', '',
            '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now())
    on conflict (id) do nothing;

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), r.id, jsonb_build_object('sub', r.id::text, 'phone', r.phone), 'phone', r.id::text, now(), now(), now())
    on conflict (provider, provider_id) do nothing;

    update public.profiles set role='candidate', nom=r.nom, prenom=r.prenom, ville=r.ville,
           commune=r.commune, photo_url=r.photo, verification_level='phone' where id=r.id;

    insert into public.candidate_profiles (user_id, services, experience_annees, competences, disponibilite, description, temps_plein, salaire_souhaite, is_active_paid)
    values (r.id, r.services, r.exp, r.competences, r.dispo, r.descr, r.tp, r.salaire, true)
    on conflict (user_id) do nothing;
  end loop;

  -- Quelques notes pour afficher des étoiles sur les fiches.
  insert into public.ratings (from_user, to_user, role_context, ponctualite, serieux, qualite, respect, communication, commentaire)
  values
    ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c1','employer_rates_candidate',5,5,4,5,5,'Très sérieuse.'),
    ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c2','employer_rates_candidate',4,5,5,4,4,'Excellente cuisine.')
  on conflict (from_user, to_user, role_context) do nothing;
end $$;

-- ---------- Catalogue volumineux : ~18 nounous générées (pour la pagination) ---
do $$
declare
  i int;
  uid uuid;
  ph text;
  prenoms text[] := array['Awa','Fatou','Mariam','Aminata','Grace','Rokia','Salimata','Adjoua','Akissi','Aya','Yasmine','Nadège','Chantal','Bintou','Kadidja','Sarah','Estelle','Prisca'];
  noms    text[] := array['Koné','Traoré','Diabaté','Ouattara','Bamba','Coulibaly','Yao','Kouassi','Touré','Cissé','Doumbia','Kouamé','Fofana','Sanogo','Gnahoré','Aka','Kacou','Brou'];
  communes text[] := array['Cocody','Yopougon','Abobo','Marcory','Koumassi','Treichville','Adjamé','Plateau','Port-Bouët','Bingerville'];
  dispos text[] := array['Disponible immédiatement','Temps plein','Temps partiel, flexible','En semaine','Week-ends inclus'];
  v_services public.service_type[];
  v_comp text[];
begin
  for i in 1..18 loop
    uid := gen_random_uuid();
    ph := '22507' || lpad((1000 + i)::text, 8, '0');  -- unique, hors plage des comptes de test

    v_services := case i % 6
      when 0 then array['garde_enfants','menage']
      when 1 then array['menage','cuisine']
      when 2 then array['garde_enfants']
      when 3 then array['menage','lessive','repassage']
      when 4 then array['assistance_personnes_agees','menage']
      else array['cuisine']
    end::public.service_type[];

    v_comp := case i % 6
      when 0 then array['Premiers secours','Éveil des enfants']
      when 1 then array['Cuisine ivoirienne','Repassage']
      when 2 then array['Aide aux devoirs','Petite enfance']
      when 3 then array['Ménage complet','Lessive']
      when 4 then array['Accompagnement seniors','Premiers secours']
      else array['Organisation','Ponctualité']
    end;

    insert into auth.users (
      instance_id, id, aud, role, phone, phone_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', ph, now(),
            '', '', '', '', '', '', '', '',
            '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now())
    on conflict (id) do nothing;

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'phone', ph), 'phone', uid::text, now(), now(), now())
    on conflict (provider, provider_id) do nothing;

    update public.profiles set
      role='candidate',
      prenom = prenoms[1 + (i % array_length(prenoms,1))],
      nom = noms[1 + ((i*3) % array_length(noms,1))],
      ville = 'Abidjan',
      commune = communes[1 + (i % array_length(communes,1))],
      photo_url = '/demo/nounou-' || (1 + (i % 5))::text || '.jpg',
      verification_level = (case when i % 4 = 0 then 'verified' else 'phone' end)::public.verification_level
    where id = uid;

    insert into public.candidate_profiles (user_id, services, experience_annees, competences, disponibilite, description, temps_plein, salaire_souhaite, is_active_paid)
    values (
      uid,
      v_services,
      1 + (i % 10),
      v_comp,
      dispos[1 + (i % array_length(dispos,1))],
      'Aide à domicile sérieuse et de confiance, à votre service en Côte d''Ivoire.',
      (i % 2 = 0),
      40000 + (i % 6) * 8000,
      true
    )
    on conflict (user_id) do nothing;
  end loop;
end $$;
