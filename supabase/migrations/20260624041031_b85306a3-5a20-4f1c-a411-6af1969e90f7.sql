CREATE POLICY "Authenticated can view task attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task-attachments');
CREATE POLICY "Authenticated can upload task attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-attachments');
CREATE POLICY "Authenticated can update task attachments" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'task-attachments');
CREATE POLICY "Authenticated can delete task attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'task-attachments');