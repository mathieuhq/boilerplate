CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA public;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.search_normalize(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT lower(public.unaccent('public.unaccent'::regdictionary, value))
$$;
