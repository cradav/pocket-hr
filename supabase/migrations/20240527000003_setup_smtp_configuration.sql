-- Enable SMTP configuration for Supabase Auth
INSERT INTO auth.config (key, value)
VALUES 
  ('mailer.smtp.admin_email', 'admin@pockethr.com'),
  ('mailer.smtp.host', 'smtp.example.com'),
  ('mailer.smtp.port', '587'),
  ('mailer.smtp.user', 'smtp_username'),
  ('mailer.smtp.pass', 'smtp_password'),
  ('mailer.smtp.max_frequency', '60'),
  ('mailer.template.invite', '{"subject":"You have been invited to join Pocket.HR","content":"<h2>You have been invited to join Pocket.HR</h2><p>You can accept the invite by clicking the link below:</p><p><a href=\"{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=invite\">Accept invitation</a></p>"}'),
  ('mailer.template.confirmation', '{"subject":"Confirm Your Pocket.HR Account","content":"<h2>Confirm Your Pocket.HR Account</h2><p>Follow this link to confirm your account:</p><p><a href=\"{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup\">Confirm account</a></p>"}'),
  ('mailer.template.recovery', '{"subject":"Reset Your Pocket.HR Password","content":"<h2>Reset Your Pocket.HR Password</h2><p>Follow this link to reset your password:</p><p><a href=\"{{ .SiteURL }}/reset-password?token={{ .Token }}\">Reset password</a></p>"}'),
  ('mailer.template.magic_link', '{"subject":"Your Pocket.HR Magic Link","content":"<h2>Your Pocket.HR Magic Link</h2><p>Follow this link to log in:</p><p><a href=\"{{ .SiteURL }}/auth/callback?token={{ .Token }}&type=magiclink\">Log in</a></p>"}'),
  ('mailer.template.email_change', '{"subject":"Confirm Your New Email for Pocket.HR","content":"<h2>Confirm Your New Email for Pocket.HR</h2><p>Follow this link to confirm your new email:</p><p><a href=\"{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=email_change\">Confirm email change</a></p>"}'),
  ('mailer.template.email_change_new', '{"subject":"Confirm Your New Email for Pocket.HR","content":"<h2>Confirm Your New Email for Pocket.HR</h2><p>Follow this link to confirm your new email:</p><p><a href=\"{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=email_change\">Confirm email change</a></p>"}'),
  ('mailer.template.reauth', '{"subject":"Reauthenticate Your Pocket.HR Account","content":"<h2>Reauthenticate Your Pocket.HR Account</h2><p>Follow this link to reauthenticate your account:</p><p><a href=\"{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=reauth\">Reauthenticate</a></p>"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;