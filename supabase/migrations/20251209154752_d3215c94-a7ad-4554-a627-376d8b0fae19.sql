-- Create game_centers table
CREATE TABLE public.game_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'گیم نت من',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add game_center_id to existing tables
ALTER TABLE public.devices ADD COLUMN game_center_id UUID REFERENCES public.game_centers(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN game_center_id UUID REFERENCES public.game_centers(id) ON DELETE CASCADE;
ALTER TABLE public.device_sessions ADD COLUMN game_center_id UUID REFERENCES public.game_centers(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN game_center_id UUID REFERENCES public.game_centers(id) ON DELETE CASCADE;

-- Update user_roles to include game_center_id
ALTER TABLE public.user_roles ADD COLUMN game_center_id UUID REFERENCES public.game_centers(id) ON DELETE CASCADE;

-- Enable RLS on game_centers
ALTER TABLE public.game_centers ENABLE ROW LEVEL SECURITY;

-- Function to get user's game center id
CREATE OR REPLACE FUNCTION public.get_user_game_center_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gc.id 
  FROM public.game_centers gc
  INNER JOIN public.user_roles ur ON ur.game_center_id = gc.id
  WHERE ur.user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user belongs to game center
CREATE OR REPLACE FUNCTION public.user_belongs_to_game_center(_user_id uuid, _game_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND game_center_id = _game_center_id
  )
$$;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone authenticated can view devices" ON public.devices;
DROP POLICY IF EXISTS "Staff can manage devices" ON public.devices;
DROP POLICY IF EXISTS "Anyone authenticated can view products" ON public.products;
DROP POLICY IF EXISTS "Staff can manage products" ON public.products;
DROP POLICY IF EXISTS "Staff can view all sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Staff can manage sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Staff can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Staff can create sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Game centers policies
CREATE POLICY "Users can view their own game center" ON public.game_centers
  FOR SELECT USING (public.user_belongs_to_game_center(auth.uid(), id));

CREATE POLICY "Owners can update their game center" ON public.game_centers
  FOR UPDATE USING (owner_id = auth.uid());

-- Devices policies (scoped to game center)
CREATE POLICY "Users can view their game center devices" ON public.devices
  FOR SELECT USING (public.user_belongs_to_game_center(auth.uid(), game_center_id));

CREATE POLICY "Staff can manage their game center devices" ON public.devices
  FOR ALL USING (
    public.user_belongs_to_game_center(auth.uid(), game_center_id) 
    AND public.is_staff_or_admin(auth.uid())
  );

-- Products policies (scoped to game center)
CREATE POLICY "Users can view their game center products" ON public.products
  FOR SELECT USING (public.user_belongs_to_game_center(auth.uid(), game_center_id));

CREATE POLICY "Staff can manage their game center products" ON public.products
  FOR ALL USING (
    public.user_belongs_to_game_center(auth.uid(), game_center_id) 
    AND public.is_staff_or_admin(auth.uid())
  );

-- Device sessions policies (scoped to game center)
CREATE POLICY "Users can view their game center sessions" ON public.device_sessions
  FOR SELECT USING (public.user_belongs_to_game_center(auth.uid(), game_center_id));

CREATE POLICY "Staff can manage their game center sessions" ON public.device_sessions
  FOR ALL USING (
    public.user_belongs_to_game_center(auth.uid(), game_center_id) 
    AND public.is_staff_or_admin(auth.uid())
  );

-- Sales policies (scoped to game center)
CREATE POLICY "Users can view their game center sales" ON public.sales
  FOR SELECT USING (public.user_belongs_to_game_center(auth.uid(), game_center_id));

CREATE POLICY "Staff can create their game center sales" ON public.sales
  FOR INSERT WITH CHECK (
    public.user_belongs_to_game_center(auth.uid(), game_center_id) 
    AND public.is_staff_or_admin(auth.uid())
  );

-- User roles policies (scoped to game center)
CREATE POLICY "Users can view roles in their game center" ON public.user_roles
  FOR SELECT USING (public.user_belongs_to_game_center(auth.uid(), game_center_id));

CREATE POLICY "Admins can manage roles in their game center" ON public.user_roles
  FOR ALL USING (
    public.user_belongs_to_game_center(auth.uid(), game_center_id)
    AND public.has_role(auth.uid(), 'admin')
  );

-- Update handle_new_user to create game center
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_game_center_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  -- Create new game center for this user
  INSERT INTO public.game_centers (name, owner_id)
  VALUES (
    COALESCE(new.raw_user_meta_data ->> 'game_center_name', 'گیم نت من'),
    new.id
  )
  RETURNING id INTO new_game_center_id;
  
  -- Make user admin of their game center
  INSERT INTO public.user_roles (user_id, role, game_center_id) 
  VALUES (new.id, 'admin', new_game_center_id);
  
  -- Create default devices for new game center
  INSERT INTO public.devices (name, type, status, hourly_rate, game_center_id) VALUES
    ('PC شماره ۱', 'pc', 'available', 50000, new_game_center_id),
    ('PC شماره ۲', 'pc', 'available', 50000, new_game_center_id),
    ('PC شماره ۳', 'pc', 'available', 50000, new_game_center_id),
    ('پلی‌استیشن ۱', 'playstation', 'available', 80000, new_game_center_id),
    ('بیلیارد ۱', 'billiard', 'available', 120000, new_game_center_id);
  
  -- Create default products for new game center
  INSERT INTO public.products (name, price, stock, category, game_center_id) VALUES
    ('نوشابه', 15000, 50, 'نوشیدنی', new_game_center_id),
    ('آبمیوه', 20000, 30, 'نوشیدنی', new_game_center_id),
    ('چیپس', 25000, 40, 'خوراکی', new_game_center_id),
    ('شکلات', 18000, 60, 'خوراکی', new_game_center_id),
    ('آب معدنی', 8000, 100, 'نوشیدنی', new_game_center_id);
  
  RETURN new;
END;
$$;

-- Delete old sample data (without game_center_id)
DELETE FROM public.sales WHERE game_center_id IS NULL;
DELETE FROM public.device_sessions WHERE game_center_id IS NULL;
DELETE FROM public.products WHERE game_center_id IS NULL;
DELETE FROM public.devices WHERE game_center_id IS NULL;

-- Add trigger for game_centers updated_at
CREATE TRIGGER update_game_centers_updated_at
  BEFORE UPDATE ON public.game_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();