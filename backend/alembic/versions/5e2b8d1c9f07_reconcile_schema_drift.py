"""reconcile schema drift (objects created outside Alembic)

Revision ID: 5e2b8d1c9f07
Revises: 933b8cb4a815
Create Date: 2026-11-08 09:30:00.000000

Contexto: várias colunas/tabelas foram criadas diretamente na BD de produção
e nunca entraram no histórico do Alembic (a migração 4811743369fa, por
exemplo, ficou com `pass`). Resultado: uma BD criada só com
`alembic upgrade head` ficava incompleta e a app falhava.

Esta migração reproduz EXATAMENTE as definições lidas da produção
(information_schema e pg_enum, 2026-11-08) e é idempotente (IF NOT EXISTS):
  - em produção, onde tudo já existe, é um no-op;
  - numa BD nova (local, branch Neon, testes), cria o que falta.

downgrade() é intencionalmente vazio: não há forma de saber se estes objetos
existiam antes desta migração, e removê-los apagaria dados de produção.
"""
from alembic import op


revision = '5e2b8d1c9f07'
down_revision = '933b8cb4a815'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # O tipo nasceu na migração inicial só com EUR/BRL; a 933b8cb4a815 usou
    # create(checkfirst=True), que não acrescenta valores a um tipo existente.
    # (Os valores novos não são usados nesta transação, por isso é seguro aqui.)
    for value in ("USD", "GBP", "CHF"):
        op.execute(f"ALTER TYPE currency_code ADD VALUE IF NOT EXISTS '{value}'")

    op.execute("ALTER TABLE recurring_bills ADD COLUMN IF NOT EXISTS active_until DATE")

    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS active_countries "
        "VARCHAR[] NOT NULL DEFAULT ARRAY['PT'::text]"
    )
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed "
        "BOOLEAN NOT NULL DEFAULT false"
    )

    op.execute("ALTER TABLE investment_assets ADD COLUMN IF NOT EXISTS institution VARCHAR(120)")
    op.execute("ALTER TABLE investment_assets ADD COLUMN IF NOT EXISTS maturity_date DATE")
    op.execute("ALTER TABLE investment_assets ADD COLUMN IF NOT EXISTS ticker VARCHAR(20)")
    op.execute("ALTER TABLE investment_assets ADD COLUMN IF NOT EXISTS shares_quantity NUMERIC(18, 6)")
    op.execute("ALTER TABLE investment_assets ADD COLUMN IF NOT EXISTS average_price NUMERIC(14, 4)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS investment_contributions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            asset_id UUID NOT NULL REFERENCES investment_assets(id) ON DELETE CASCADE,
            amount NUMERIC(14, 2) NOT NULL,
            contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
            note VARCHAR(200),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)


def downgrade() -> None:
    pass
