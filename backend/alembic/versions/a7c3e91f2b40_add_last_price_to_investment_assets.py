"""add last price (quote cache L2) to investment_assets

Revision ID: a7c3e91f2b40
Revises: 5e2b8d1c9f07
Create Date: 2026-11-08 10:00:00.000000

Colunas todas nullable e sem default: a migração é instantânea, não
reescreve a tabela e o código antigo (que não as conhece) continua a
funcionar — pode correr antes ou depois do deploy do backend novo.
"""
from alembic import op
import sqlalchemy as sa


revision = 'a7c3e91f2b40'
down_revision = '5e2b8d1c9f07'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Preço na moeda em que o provedor o cota (já normalizado: GBp -> GBP)
    op.add_column('investment_assets', sa.Column(
        'last_price', sa.Numeric(18, 6), nullable=True))
    # String livre (não o enum currency_code): um ticker pode cotar numa
    # moeda que ainda não suportamos (ex: SEK) e queremos guardá-la na mesma.
    op.add_column('investment_assets', sa.Column(
        'last_price_currency', sa.String(3), nullable=True))
    op.add_column('investment_assets', sa.Column(
        'last_price_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('investment_assets', 'last_price_at')
    op.drop_column('investment_assets', 'last_price_currency')
    op.drop_column('investment_assets', 'last_price')
