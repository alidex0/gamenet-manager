-- Create enum for device types
CREATE TYPE public.device_type AS ENUM ('pc', 'playstation', 'billiard', 'other');

-- Create enum for device status
CREATE TYPE public.device_status AS ENUM ('available', 'occupied', 'maintenance');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  UNIQUE (user_id, role)
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type device_type NOT NULL DEFAULT 'pc',
  status device_status NOT NULL DEFAULT 'available',
  hourly_rate INTEGER NOT NULL DEFAULT 50000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create device sessions table
CREATE TABLE public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  total_paused_seconds INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  total_cost INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  sold_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      AND role = _role
  )
$$;

-- Create function to check if user is staff or admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
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
      AND role IN ('admin', 'staff')
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_staff_or_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Devices policies (staff and admin can manage)
CREATE POLICY "Anyone authenticated can view devices" ON public.devices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage devices" ON public.devices
  FOR ALL USING (public.is_staff_or_admin(auth.uid()));

-- Device sessions policies
CREATE POLICY "Staff can view all sessions" ON public.device_sessions
  FOR SELECT USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Users can view their own sessions" ON public.device_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage sessions" ON public.device_sessions
  FOR ALL USING (public.is_staff_or_admin(auth.uid()));

-- Products policies
CREATE POLICY "Anyone authenticated can view products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage products" ON public.products
  FOR ALL USING (public.is_staff_or_admin(auth.uid()));

-- Sales policies
CREATE POLICY "Staff can view all sales" ON public.sales
  FOR SELECT USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can create sales" ON public.sales
  FOR INSERT WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- Create trigger function for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  -- First user becomes admin, others become customers
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'customer');
  END IF;
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default devices
INSERT INTO public.devices (name, type, status, hourly_rate) VALUES
  ('PC شماره ۱', 'pc', 'available', 50000),
  ('PC شماره ۲', 'pc', 'available', 50000),
  ('PC شماره ۳', 'pc', 'available', 50000),
  ('PC شماره ۴', 'pc', 'available', 50000),
  ('PC شماره ۵', 'pc', 'available', 50000),
  ('پلی‌استیشن ۱', 'playstation', 'available', 80000),
  ('پلی‌استیشن ۲', 'playstation', 'available', 80000),
  ('بیلیارد ۱', 'billiard', 'available', 120000),
  ('بیلیارد ۲', 'billiard', 'available', 120000);

-- Insert default products
INSERT INTO public.products (name, price, stock, category) VALUES
  ('نوشابه', 15000, 48, 'نوشیدنی'),
  ('آبمیوه', 20000, 24, 'نوشیدنی'),
  ('چیپس', 25000, 36, 'خوراکی'),
  ('شکلات', 18000, 60, 'خوراکی'),
  ('بیسکویت', 12000, 40, 'خوراکی'),
  ('آب معدنی', 8000, 100, 'نوشیدنی'),
  ('ساندویچ', 45000, 12, 'غذا'),
  ('پیتزا شخصی', 85000, 8, 'غذا');