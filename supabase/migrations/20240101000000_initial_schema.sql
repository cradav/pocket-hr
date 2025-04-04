-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  word_credits_total INTEGER DEFAULT 1000,
  word_credits_remaining INTEGER DEFAULT 1000,
  avatar_url TEXT
);

-- Create career_stages table
CREATE TABLE career_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assistants table
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  mode TEXT NOT NULL,
  career_stage_id UUID REFERENCES career_stages(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_prompts table
CREATE TABLE system_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_sessions table
CREATE TABLE support_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle TEXT NOT NULL,
  word_credits INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plan_features table
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  included BOOLEAN DEFAULT TRUE,
  limit INTEGER
);

-- Create company_policies table
CREATE TABLE company_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_news table
CREATE TABLE company_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_news ENABLE ROW LEVEL SECURITY;

-- Create policy for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policy for documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create policy for support_sessions
CREATE POLICY "Users can view their own support sessions" ON support_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support sessions" ON support_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support sessions" ON support_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for public data
CREATE POLICY "Anyone can view active career stages" ON career_stages
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active assistants" ON assistants
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view plan features" ON plan_features
  FOR SELECT USING (TRUE);

-- Insert initial data for career stages
INSERT INTO career_stages (name, description) VALUES
('Landing the Role', 'Assistance for job searching, applications, and interviews'),
('Excel at Work', 'Support for workplace performance and professional development'),
('Moving On', 'Guidance for career transitions and departures');

-- Get the UUIDs of the inserted career stages
DO $$
DECLARE
  landing_id UUID;
  excelling_id UUID;
  moving_id UUID;
BEGIN
  SELECT id INTO landing_id FROM career_stages WHERE name = 'Landing the Role';
  SELECT id INTO excelling_id FROM career_stages WHERE name = 'Excel at Work';
  SELECT id INTO moving_id FROM career_stages WHERE name = 'Moving On';
  
  -- Insert assistants for Landing the Role
  INSERT INTO assistants (name, description, mode, career_stage_id) VALUES
  ('Resume Coach', 'Get expert help optimizing your resume for job applications and ATS systems', 'resume-coach', landing_id),
  ('Negotiation Advisor', 'Get strategic advice on negotiating job offers and compensation packages', 'negotiation-advisor', landing_id),
  ('Interview Practice Partner', 'Practice for job interviews with customized questions and detailed feedback', 'interview-practice', landing_id);
  
  -- Insert assistants for Excel at Work
  INSERT INTO assistants (name, description, mode, career_stage_id) VALUES
  ('Performance Improvement Advisor', 'Get personalized guidance on improving your workplace performance', 'performance-advisor', excelling_id),
  ('Onboarding Assistant', 'Navigate your first days and weeks at a new job with confidence', 'onboarding', excelling_id),
  ('Benefits Advisor', 'Understand and optimize your employee benefits package', 'benefits-advisor', excelling_id);
  
  -- Insert assistants for Moving On
  INSERT INTO assistants (name, description, mode, career_stage_id) VALUES
  ('Transition Coach', 'Get guidance on smoothly transitioning to your next opportunity', 'transition-coach', moving_id),
  ('Reference Builder', 'Create effective professional references and recommendations', 'reference-builder', moving_id),
  ('Exit Strategy Planner', 'Plan a professional and strategic departure from your current role', 'exit-strategy', moving_id);
  
  -- Insert system prompts for each assistant
  INSERT INTO system_prompts (assistant_id, name, content)
  SELECT id, name || ' System Prompt', 
    CASE 
      WHEN mode = 'resume-coach' THEN 'You are an expert resume coach. Help the user create or optimize their resume for job applications and ATS systems. Provide specific, actionable advice tailored to their industry and experience level.'
      WHEN mode = 'negotiation-advisor' THEN 'You are an expert negotiation advisor. Provide strategic guidance on negotiating job offers, compensation packages, and benefits. Help the user understand their leverage points and how to professionally advocate for themselves.'
      WHEN mode = 'interview-practice' THEN 'You are an expert interview coach. Help the user prepare for job interviews with practice questions, feedback, and strategies tailored to their industry and the specific role they''re applying for.'
      WHEN mode = 'performance-advisor' THEN 'You are a performance improvement advisor. Help the user enhance their workplace performance and prepare for reviews. Provide actionable strategies for professional development and career advancement.'
      WHEN mode = 'onboarding' THEN 'You are an onboarding assistant. Help the user navigate their first days and weeks at a new job. Provide guidance on understanding company culture, building relationships, and setting themselves up for success.'
      WHEN mode = 'benefits-advisor' THEN 'You are a benefits advisor. Help the user understand and optimize their employee benefits package. Provide guidance on health insurance, retirement plans, and other workplace benefits.'
      WHEN mode = 'transition-coach' THEN 'You are a transition coach. Help the user smoothly transition to their next opportunity. Provide guidance on resignation processes, knowledge transfer, and preparing for a new role.'
      WHEN mode = 'reference-builder' THEN 'You are a reference building expert. Help the user create effective professional references and recommendations. Provide guidance on selecting references, preparing them, and leveraging recommendations.'
      WHEN mode = 'exit-strategy' THEN 'You are an exit strategy planner. Help the user plan a professional and strategic departure from their current role. Provide guidance on timing, communication, and maintaining relationships.'
      ELSE 'You are an AI HR assistant. Provide helpful, professional advice on career and workplace topics. Be concise, specific, and actionable in your responses.'
    END
  FROM assistants;
  
  -- Insert subscription plans
  INSERT INTO subscription_plans (name, description, price, billing_cycle, word_credits) VALUES
  ('Free', 'Basic HR assistance for individuals', 0, 'monthly', 1000),
  ('Pro Monthly', 'Enhanced HR support for professionals', 14.99, 'monthly', 10000),
  ('Premium Monthly', 'Comprehensive HR solutions with expert support', 39.99, 'monthly', 50000),
  ('Pro Annual', 'Save 20% with annual billing', 143.90, 'annual', 10000),
  ('Premium Annual', 'Save 20% with our most comprehensive plan', 383.90, 'annual', 50000);
  
  -- Insert plan features
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'Access to Live Experts', TRUE
  FROM subscription_plans WHERE name = 'Free';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, '1,000 AI-Generated Words per Month', TRUE
  FROM subscription_plans WHERE name = 'Free';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'Pocket.HR AI Assistants', TRUE
  FROM subscription_plans WHERE name = 'Free';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'AI-Driven Correspondence', TRUE
  FROM subscription_plans WHERE name = 'Free';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'Document Management and Analysis', TRUE
  FROM subscription_plans WHERE name = 'Free';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'AI Support', FALSE
  FROM subscription_plans WHERE name = 'Free';
  
  -- Add more features for other plans
  -- Pro Monthly
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'Access to Live HR Experts', TRUE
  FROM subscription_plans WHERE name = 'Pro Monthly';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, '10,000 AI-Generated Words per Month', TRUE
  FROM subscription_plans WHERE name = 'Pro Monthly';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'AI Support', TRUE
  FROM subscription_plans WHERE name = 'Pro Monthly';
  
  -- Premium Monthly
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'Priority Access to Live HR Experts', TRUE
  FROM subscription_plans WHERE name = 'Premium Monthly';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, '50,000 AI-Generated Words per Month', TRUE
  FROM subscription_plans WHERE name = 'Premium Monthly';
  
  INSERT INTO plan_features (plan_id, name, included)
  SELECT id, 'One 30-Minute Live HR Expert Consultation per month ($49 Value)', TRUE
  FROM subscription_plans WHERE name = 'Premium Monthly';
  
END $$;
