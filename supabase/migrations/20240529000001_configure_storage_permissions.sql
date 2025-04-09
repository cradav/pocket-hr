-- Configure storage bucket and permissions
-- Create bucket if it doesn't exist
-- Note: This approach uses the SQL API to directly create the bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
VALUES ('phr-bucket', 'phr-bucket', true, false, 10485760, null, null)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets
FOR INSERT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to select buckets
CREATE POLICY "Allow authenticated users to select buckets"
ON storage.buckets
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to update buckets
CREATE POLICY "Allow authenticated users to update buckets"
ON storage.buckets
FOR UPDATE 
TO authenticated
USING (true);

-- Create policies for objects (files) in the phr-bucket
-- Policy for inserting objects
CREATE POLICY "Allow authenticated users to upload objects to phr-bucket"
ON storage.objects
FOR INSERT
TO authenticated
USING (bucket_id = 'phr-bucket' AND auth.uid() = owner);

-- Policy for selecting objects
CREATE POLICY "Allow authenticated users to view their own objects in phr-bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'phr-bucket' AND (auth.uid() = owner OR owner IS NULL));

-- Policy for updating objects
CREATE POLICY "Allow authenticated users to update their own objects in phr-bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'phr-bucket' AND auth.uid() = owner);

-- Policy for deleting objects
CREATE POLICY "Allow authenticated users to delete their own objects in phr-bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'phr-bucket' AND auth.uid() = owner); 