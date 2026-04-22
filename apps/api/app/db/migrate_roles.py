import logging
from sqlalchemy import text, create_engine
from app.core.config import Settings
from app.db.session import _normalize_database_url

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_sql(conn, query):
    try:
        conn.execute(text(query))
        conn.commit()
    except Exception as e:
        logger.error(f"Query failed: {query}. Error: {e}")
        conn.rollback()
        raise

def migrate():
    settings = Settings()
    db_url = _normalize_database_url(settings.database_url)
    engine = create_engine(db_url)

    with engine.connect() as conn:
        try:
            conn.begin()

            logger.info("Ensuring 'role' column exists...")
            run_sql(conn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32)")

            logger.info("Migrating data from 'roles' JSON to 'role' string...")
            # Populate from JSON if JSON exists and role is null
            try:
                run_sql(conn, "UPDATE users SET role = roles->>0 WHERE role IS NULL AND roles IS NOT NULL")
            except Exception as e:
                logger.warning(f"Failed to migrate roles data: {e}")

            logger.info("Setting default role where missing...")
            run_sql(conn, "UPDATE users SET role = 'tenant_admin' WHERE role IS NULL")

            logger.info("Dropping obsolete 'roles' column if it exists...")
            run_sql(conn, "ALTER TABLE users DROP COLUMN IF EXISTS roles")

            logger.info("Ensuring customers table also has role...")
            run_sql(conn, "ALTER TABLE customers ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'customer'")

            conn.commit()
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            conn.rollback()
            raise

    logger.info("Migration script execution finished.")

if __name__ == "__main__":
    migrate()
