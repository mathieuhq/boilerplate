CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;

CREATE OR REPLACE FUNCTION public.search_normalize(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT lower(public.unaccent('public.unaccent'::regdictionary, value))
$$;

CREATE INDEX "user_name_search_idx" ON "user" USING gin (public.search_normalize("name") public.gin_trgm_ops);

CREATE INDEX "user_email_search_idx" ON "user" USING gin (public.search_normalize("email") public.gin_trgm_ops);

CREATE INDEX "organization_name_search_idx" ON "organization" USING gin (public.search_normalize("name") public.gin_trgm_ops);

CREATE INDEX "organization_slug_search_idx" ON "organization" USING gin (public.search_normalize("slug") public.gin_trgm_ops);
