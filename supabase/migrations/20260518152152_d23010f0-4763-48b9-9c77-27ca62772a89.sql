
-- 1. Fix profiles cross-tenant leakage
CREATE OR REPLACE FUNCTION public.can_staff_view_profile(_staff_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur_staff
    JOIN public.user_roles ur_target
      ON ur_target.game_center_id = ur_staff.game_center_id
    WHERE ur_staff.user_id = _staff_id
      AND ur_staff.role IN ('admin','staff')
      AND ur_target.user_id = _profile_id
  )
$$;

DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view profiles in their game center"
ON public.profiles FOR SELECT TO authenticated
USING (public.can_staff_view_profile(auth.uid(), id));

-- 2. Fix privilege escalation in user_roles via scoped has_role
CREATE OR REPLACE FUNCTION public.has_role_in_game_center(_user_id uuid, _role app_role, _game_center_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND game_center_id = _game_center_id
  )
$$;

DROP POLICY IF EXISTS "Admins can manage roles in their game center" ON public.user_roles;
CREATE POLICY "Admins can manage roles in their game center"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role_in_game_center(auth.uid(), 'admin'::app_role, game_center_id))
WITH CHECK (public.has_role_in_game_center(auth.uid(), 'admin'::app_role, game_center_id));

-- 3. Add explicit INSERT policy on game_centers (owner spoofing prevention)
DROP POLICY IF EXISTS "Users can create their own game center" ON public.game_centers;
CREATE POLICY "Users can create their own game center"
ON public.game_centers FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());
