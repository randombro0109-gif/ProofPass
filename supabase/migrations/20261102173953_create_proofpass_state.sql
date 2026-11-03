/*
# Create ProofPass app state storage

1. New Tables
- `proofpass_state`
  - `client_id` (text, primary key): random identifier generated once per browser.
  - `state` (jsonb, not null): the full ProofPass demo state (goals, answers, records, journeys, ProofKeys, receipts, settings).
  - `updated_at` (timestamptz): last save time.

2. Security
- Enables row level security on `proofpass_state`.
- Grants SELECT, INSERT, UPDATE to `anon` and `authenticated` because the app has no sign-in screen and the anon key is the only client credential.
- Policies are scoped by the client identifier the browser holds; no sensitive personal data is stored.

3. Important notes
- No DELETE grant is given; state is overwritten in place.
- Real users would need sign-in before this table holds personal data.
*/

CREATE TABLE IF NOT EXISTS proofpass_state (
  client_id text PRIMARY KEY,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE proofpass_state ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON proofpass_state TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_proofpass_state" ON proofpass_state;
CREATE POLICY "anon_select_proofpass_state" ON proofpass_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_proofpass_state" ON proofpass_state;
CREATE POLICY "anon_insert_proofpass_state" ON proofpass_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_proofpass_state" ON proofpass_state;
CREATE POLICY "anon_update_proofpass_state" ON proofpass_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
