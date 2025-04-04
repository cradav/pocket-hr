-- Fix users table INSERT statement by removing job_title column
INSERT INTO public.users (id, name, email, company, stripe_customer_id, stripe_subscription_id, subscription_status, email_notifications, push_notifications, weekly_digest, consultation_reminders, free_consultations_remaining, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'Pocket HR', 'cus_premium1', 'sub_premium1', 'active', true, true, false, true, 3, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'user1@example.com', 'Acme Corp', 'cus_premium2', 'sub_premium2', 'active', true, true, true, true, 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'John Doe', 'user2@example.com', 'XYZ Inc', NULL, NULL, NULL, true, false, false, true, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Fix policy that references job_title
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND email = 'admin@example.com'
  ));