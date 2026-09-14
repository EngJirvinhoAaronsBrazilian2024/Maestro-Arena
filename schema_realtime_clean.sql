INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('match:%', 'H2H match updates', true)
ON CONFLICT (pattern) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

CREATE OR REPLACE FUNCTION public.notify_match_updated()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'match:' || NEW.id::text,
    'match_updated',
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER match_updated_trigger
AFTER UPDATE ON public.h2h_matches
FOR EACH ROW
EXECUTE FUNCTION public.notify_match_updated();
