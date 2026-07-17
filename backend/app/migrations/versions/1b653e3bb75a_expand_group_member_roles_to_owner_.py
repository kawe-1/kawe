"""expand group member roles to owner, admin, member

Revision ID: 1b653e3bb75a
Revises: a33c8cf206d1
Create Date: 2026-07-17 15:04:36.724013

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1b653e3bb75a"
down_revision: Union[str, Sequence[str], None] = "a33c8cf206d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_check_constraint(
        "ck_group_member_role", "group_members", "role IN ('owner', 'admin', 'member')"
    )

    # Update existing 'admin' roles to 'owner' (if any)
    op.execute("UPDATE group_members SET role = 'owner' WHERE role = 'admin'")

    # Optional: Ensure all rows have a valid role
    op.execute(
        "UPDATE group_members SET role = 'member' WHERE role IS NULL OR role = ''"
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_group_member_role", "group_members", type_="check")

    # Optionally revert roles if desired
    # op.execute("UPDATE group_members SET role = 'admin' WHERE role = 'owner'")
    # ### end Alembic commands ###
