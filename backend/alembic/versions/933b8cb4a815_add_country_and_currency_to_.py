"""add country and currency to transactional tables

Revision ID: 933b8cb4a815
Revises: 4811743369fa
Create Date: 2026-10-02 13:47:54.214410

"""
from alembic import op
import sqlalchemy as sa


revision = '933b8cb4a815'
down_revision = '4811743369fa'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Garante a criação do ENUM currency_code se ainda não existir
    currency_enum = sa.Enum('EUR', 'BRL', 'USD', 'GBP',
                            'CHF', name='currency_code')
    country_enum = sa.Enum('PT', 'BR', name='country_code')

    currency_enum.create(op.get_bind(), checkfirst=True)
    country_enum.create(op.get_bind(), checkfirst=True)

    # 2. Adiciona colunas com default para não quebrar registros existentes
    op.add_column('credit_cards', sa.Column(
        'country', country_enum, nullable=False, server_default='PT'))
    op.add_column('credit_cards', sa.Column(
        'currency', currency_enum, nullable=False, server_default='EUR'))

    op.add_column('daily_expenses', sa.Column(
        'country', country_enum, nullable=False, server_default='PT'))
    op.add_column('daily_expenses', sa.Column(
        'currency', currency_enum, nullable=False, server_default='EUR'))

    op.add_column('incomes', sa.Column('country', country_enum,
                  nullable=False, server_default='PT'))
    op.add_column('incomes', sa.Column('currency', currency_enum,
                  nullable=False, server_default='EUR'))

    op.add_column('recurring_bills', sa.Column(
        'country', country_enum, nullable=False, server_default='PT'))
    op.add_column('recurring_bills', sa.Column(
        'currency', currency_enum, nullable=False, server_default='EUR'))


def downgrade() -> None:
    op.drop_column('recurring_bills', 'currency')
    op.drop_column('recurring_bills', 'country')
    op.drop_column('incomes', 'currency')
    op.drop_column('incomes', 'country')
    op.drop_column('daily_expenses', 'currency')
    op.drop_column('daily_expenses', 'country')
    op.drop_column('credit_cards', 'currency')
    op.drop_column('credit_cards', 'country')
