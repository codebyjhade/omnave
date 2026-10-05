-- The previous project setup left a SECURITY DEFINER signup function in the
-- exposed public schema. Phase 1 installs the trigger function in private.
drop function if exists public.handle_new_user();
