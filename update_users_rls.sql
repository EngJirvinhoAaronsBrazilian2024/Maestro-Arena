CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
