-- Seed users table
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'user1@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'user2@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed public.users table with corresponding user profiles
INSERT INTO public.users (id, full_name, email, phone, company, job_title, plan_type, stripe_customer_id, stripe_subscription_id, subscription_status, email_notifications, push_notifications, weekly_digest, consultation_reminders, free_consultations_remaining, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', '+1234567890', 'Pocket HR', 'Administrator', 'premium', 'cus_premium1', 'sub_premium1', 'active', true, true, false, true, 3, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'user1@example.com', '+1987654321', 'Acme Corp', 'HR Manager', 'premium', 'cus_premium2', 'sub_premium2', 'active', true, true, true, true, 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'John Doe', 'user2@example.com', '+1122334455', 'XYZ Inc', 'Software Developer', 'basic', NULL, NULL, NULL, true, false, false, true, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed career_stages table
CREATE TABLE IF NOT EXISTS career_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO career_stages (id, name, description, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Starting', 'Beginning your career journey', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'Growing', 'Developing your skills and experience', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'Excelling', 'Mastering your role and leading others', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', 'Transitioning', 'Changing roles or industries', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed assistants table
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  mode TEXT NOT NULL,
  career_stage_id UUID REFERENCES career_stages(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO assistants (id, name, description, mode, career_stage_id, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000020', 'Resume Coach', 'Help optimize your resume for job applications', 'resume-coach', '00000000-0000-0000-0000-000000000010', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000021', 'Interview Practice', 'Prepare for job interviews with practice questions', 'interview-practice', '00000000-0000-0000-0000-000000000010', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000022', 'Negotiation Advisor', 'Strategic guidance on negotiating job offers', 'negotiation-advisor', '00000000-0000-0000-0000-000000000011', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000023', 'Performance Advisor', 'Enhance workplace performance and prepare for reviews', 'performance-advisor', '00000000-0000-0000-0000-000000000012', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000024', 'Benefits Advisor', 'Understand and optimize employee benefits', 'benefits-advisor', '00000000-0000-0000-0000-000000000013', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id),
  assistant_id UUID REFERENCES assistants(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO conversations (id, title, user_id, assistant_id, last_updated, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000030', 'Resume Review', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000020', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000031', 'Interview Preparation', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000032', 'Salary Negotiation', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000022', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_voice BOOLEAN DEFAULT false,
  audio_url TEXT
);

INSERT INTO messages (id, conversation_id, content, sender, timestamp, is_voice)
VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000030', 'Hello! I need help optimizing my resume for a software developer position.', 'user', NOW() - INTERVAL '2 days', false),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000030', 'I''d be happy to help you optimize your resume for a software developer position. Could you share your current resume or tell me about your experience and skills?', 'ai', NOW() - INTERVAL '2 days', false),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000031', 'I have an interview for a product manager role next week. Can you help me prepare?', 'user', NOW() - INTERVAL '1 day', false),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000031', 'Absolutely! I can help you prepare for your product manager interview. Let''s start by discussing some common questions you might encounter and strategies for answering them effectively.', 'ai', NOW() - INTERVAL '1 day', false),
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000032', 'I received a job offer but the salary is lower than I expected. How should I negotiate?', 'user', NOW() - INTERVAL '12 hours', false),
  ('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000032', 'Congratulations on your job offer! When negotiating salary, it''s important to research market rates for your position and location first. Be prepared to justify your ask with specific achievements and value you bring. Remember that compensation includes more than just salary - consider benefits, work-life balance, and growth opportunities.', 'ai', NOW() - INTERVAL '12 hours', false)
ON CONFLICT (id) DO NOTHING;

-- Seed documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  size INTEGER NOT NULL
);

INSERT INTO documents (id, user_id, name, description, file_url, file_type, upload_date, size)
VALUES
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000002', 'Resume.pdf', 'My current resume', 'https://example.com/files/resume.pdf', 'application/pdf', NOW() - INTERVAL '5 days', 245000),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000002', 'Employment Contract.docx', 'Current employment contract', 'https://example.com/files/contract.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', NOW() - INTERVAL '3 days', 350000),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000003', 'Performance Review.pdf', 'Annual performance review', 'https://example.com/files/review.pdf', 'application/pdf', NOW() - INTERVAL '1 day', 180000)
ON CONFLICT (id) DO NOTHING;

-- Seed appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  consultant_name TEXT NOT NULL,
  consultation_type TEXT NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO appointments (id, user_id, consultant_name, consultation_type, appointment_date, duration, status, notes, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000002', 'Sarah Johnson', 'HR Advocate', NOW() + INTERVAL '2 days', 30, 'scheduled', 'Discuss career development plan', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000003', 'Jessica Martinez', 'Legal Consultant', NOW() + INTERVAL '3 days', 60, 'scheduled', 'Review new employment contract', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000002', 'Michael Chen', 'HR Advocate', NOW() - INTERVAL '5 days', 30, 'completed', 'Discussed benefits package options', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Seed plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle TEXT NOT NULL,
  word_credits INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO plans (id, name, description, price, billing_cycle, word_credits, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000070', 'Basic', 'Essential HR assistance for individuals', 0.00, 'monthly', 1000, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000071', 'Premium', 'Advanced HR support with priority features', 29.99, 'monthly', 5000, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000072', 'Enterprise', 'Complete HR solution for organizations', 99.99, 'monthly', 20000, true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000073', 'Premium Annual', 'Annual subscription with discount', 299.99, 'annual', 60000, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed plan_features table
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES plans(id),
  name TEXT NOT NULL,
  included BOOLEAN NOT NULL,
  feature_limit INTEGER
);

INSERT INTO plan_features (id, plan_id, name, included, feature_limit)
VALUES
  -- Basic Plan Features
  ('00000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000070', 'AI Assistant', true, NULL),
  ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000070', 'Document Storage', true, 5),
  ('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000070', 'Human Support', false, NULL),
  ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000070', 'Voice Conversations', false, NULL),
  
  -- Premium Plan Features
  ('00000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000071', 'AI Assistant', true, NULL),
  ('00000000-0000-0000-0000-000000000085', '00000000-0000-0000-0000-000000000071', 'Document Storage', true, 50),
  ('00000000-0000-0000-0000-000000000086', '00000000-0000-0000-0000-000000000071', 'Human Support', true, 2),
  ('00000000-0000-0000-0000-000000000087', '00000000-0000-0000-0000-000000000071', 'Voice Conversations', true, NULL),
  
  -- Enterprise Plan Features
  ('00000000-0000-0000-0000-000000000088', '00000000-0000-0000-0000-000000000072', 'AI Assistant', true, NULL),
  ('00000000-0000-0000-0000-000000000089', '00000000-0000-0000-0000-000000000072', 'Document Storage', true, 500),
  ('00000000-0000-0000-0000-000000000090', '00000000-0000-0000-0000-000000000072', 'Human Support', true, 10),
  ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000072', 'Voice Conversations', true, NULL),
  
  -- Premium Annual Plan Features
  ('00000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000073', 'AI Assistant', true, NULL),
  ('00000000-0000-0000-0000-000000000093', '00000000-0000-0000-0000-000000000073', 'Document Storage', true, 100),
  ('00000000-0000-0000-0000-000000000094', '00000000-0000-0000-0000-000000000073', 'Human Support', true, 24),
  ('00000000-0000-0000-0000-000000000095', '00000000-0000-0000-0000-000000000073', 'Voice Conversations', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable row level security for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND job_title = 'Administrator'
  ));

-- Create policies for conversations table
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policies for messages table
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
CREATE POLICY "Users can view messages from their conversations"
  ON messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  ));

-- Create policies for documents table
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policies for appointments table
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments"
  ON appointments
  FOR SELECT
  USING (user_id = auth.uid());

-- Enable realtime for relevant tables
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table appointments;
