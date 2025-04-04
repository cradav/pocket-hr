-- Add new admin user with email cra.dav@gmail.com
-- First check if the user already exists in auth.users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cra.dav@gmail.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES
      ('00000000-0000-0000-0000-000000000006', 'cra.dav@gmail.com', '$2a$10$Nt0RBwSKJvXZs/Tn.YhQj.Qs9KJWxQM1QJJCJkSQRZJ.DkVj2xLJm', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Admin User"}');
  END IF;
END
$$;

-- Add corresponding entry in public.users table with all necessary fields for Stripe functionality
-- First check if the user already exists in public.users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'cra.dav@gmail.com') THEN
    INSERT INTO public.users (id, name, email, company, plan_type, stripe_customer_id, stripe_subscription_id, subscription_status, email_notifications, push_notifications, weekly_digest, consultation_reminders, free_consultations_remaining, created_at, updated_at)
    VALUES
      ('00000000-0000-0000-0000-000000000006', 'Admin User', 'cra.dav@gmail.com', 'Pocket HR', 'premium', NULL, NULL, 'active', true, true, false, true, 3, NOW(), NOW());
  END IF;
END
$$;

-- Update admin policy to include the new admin user
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (email = 'admin@example.com' OR email = 'cra.dav@gmail.com')
  ));