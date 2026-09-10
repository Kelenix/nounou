-- ============================================================================
-- Garde-fou d'identité de profil (côté base, inviolable).
--
-- Dès qu'un compte est « actif » (rôle candidate/employer choisi, non supprimé),
-- il DOIT avoir un téléphone valide et un vrai nom/prénom (pas « test », etc.).
-- Reflète src/lib/profile-validation.ts (la validation client est l'UX ; ceci
-- est le filet de sécurité, car les profils sont écrits directement via le client).
--
-- La règle ne s'applique QUE lorsque l'identité change ou qu'un rôle est activé,
-- pour ne pas bloquer les actions admin (suspension, restauration…) qui ne
-- touchent pas au nom/téléphone. Les admins et les comptes supprimés sont exemptés.
-- ============================================================================

create or replace function public.enforce_profile_identity()
returns trigger language plpgsql as $$
declare
  forbidden text[] := array[
    'test','tests','testtest','essai','essaie','fake','faux','sansnom','nom',
    'prenom','name','username','user','utilisateur','root','idiot','idio',
    'azerty','qwerty','azer','qsdf','aaa','bbb','ccc','xxx','yyy','zzz','abc',
    'abcd','abcde','toto','tata','titi','tutu','tete','login','demo','example',
    'exemple','anonyme','inconnu','nobody','asdf','asd','jkl','qwe'
  ];
  p text;
  n text;
  ph text;
begin
  -- Exemptions : pas de rôle (onboarding non terminé), admin, ou compte supprimé.
  if new.role is null or new.role = 'admin' or new.deleted_at is not null then
    return new;
  end if;

  -- Si l'identité n'a pas changé sur un compte déjà actif, on laisse passer
  -- (actions admin : suspension, restauration, changement de rôle…).
  if tg_op = 'UPDATE'
     and new.prenom is not distinct from old.prenom
     and new.nom is not distinct from old.nom
     and new.phone is not distinct from old.phone
     and old.role is not null then
    return new;
  end if;

  -- Nom / prénom obligatoires, ≥ 2 caractères, sans chiffres.
  if new.prenom is null or new.nom is null
     or length(btrim(new.prenom)) < 2 or length(btrim(new.nom)) < 2
     or new.prenom ~ '\d' or new.nom ~ '\d' then
    raise exception 'PROFILE_NAME_INVALID';
  end if;

  -- Pas de nom factice ni de lettre répétée (« aaaa »).
  p := regexp_replace(lower(btrim(new.prenom)), '[^a-z]', '', 'g');
  n := regexp_replace(lower(btrim(new.nom)), '[^a-z]', '', 'g');
  if p = any(forbidden) or n = any(forbidden)
     or p ~ '^(.)\1+$' or n ~ '^(.)\1+$'
     or length(p) < 2 or length(n) < 2 then
    raise exception 'PROFILE_NAME_INVALID';
  end if;

  -- Téléphone obligatoire et valide (10 chiffres locaux ou 225 + 10).
  ph := regexp_replace(coalesce(new.phone, ''), '\D', '', 'g');
  if ph !~ '^\d{10}$' and ph !~ '^225\d{10}$' then
    raise exception 'PROFILE_PHONE_INVALID';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_identity on public.profiles;
create trigger trg_enforce_profile_identity
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_identity();
