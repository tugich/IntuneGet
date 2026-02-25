-- Fix: Set role to 'owner' for all MSP organization creators
-- who were incorrectly assigned the default 'operator' role.
-- See: https://github.com/ugurkocde/IntuneGet/issues/53

UPDATE msp_user_memberships m
SET role = 'owner'
FROM msp_organizations o
WHERE m.msp_organization_id = o.id
  AND m.user_id = o.created_by_user_id
  AND m.role != 'owner';

-- Change default role from 'operator' to 'viewer' (principle of least privilege).
-- Any membership created without an explicit role should get the lowest privilege.
ALTER TABLE msp_user_memberships ALTER COLUMN role SET DEFAULT 'viewer'::msp_role;
