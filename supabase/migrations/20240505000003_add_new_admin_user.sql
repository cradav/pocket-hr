-- Add new admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000004', 'cradav@gmail.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add corresponding user profile in public.users table
INSERT INTO public.users (id, name, email, company, job_title, plan_type, stripe_customer_id, stripe_subscription_id, subscription_status, email_notifications, push_notifications, weekly_digest, consultation_reminders, free_consultations_remaining, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000004', 'Craig Davis', 'cradav@gmail.com', 'Pocket HR', 'Administrator', 'premium', 'cus_premium3', 'sub_premium3', 'active', true, true, false, true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
