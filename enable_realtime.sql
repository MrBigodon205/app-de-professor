-- Enable Realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE class_grades;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE plans;
ALTER PUBLICATION supabase_realtime ADD TABLE students; -- Good for transfers
