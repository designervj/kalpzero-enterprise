import logging
import json
from sqlalchemy import text
from app.core.config import Settings
from app.db.session import _normalize_database_url, get_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_sql(conn, query):
    try:
        conn.execute(text(query))
        conn.commit()
        return True
    except Exception as e:
        logger.warning(f"Query failed: {query}. Error: {e}")
        conn.rollback()
        return False

def migrate():
    settings = Settings()
    db_url = _normalize_database_url(settings.database_url)
    engine = get_engine(db_url)
    
    with engine.connect() as conn:
        logger.info("Ensuring 'role' column exists...")
        run_sql(conn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32)")
        
        logger.info("Migrating data from 'roles' JSON to 'role' string...")
        # Populate from JSON if JSON exists and role is null
        try:
            run_sql(conn, "UPDATE users SET role = roles->>0 WHERE role IS NULL AND roles IS NOT NULL")
        except Exception:
            pass

        logger.info("Setting default role where missing...")
        run_sql(conn, "UPDATE users SET role = 'tenant_admin' WHERE role IS NULL")

        logger.info("Dropping obsolete 'roles' column if it exists...")
        run_sql(conn, "ALTER TABLE users DROP COLUMN IF EXISTS roles")

        logger.info("Ensuring customers table also has role...")
        run_sql(conn, "ALTER TABLE customers ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'customer'")

    logger.info("Migration script execution finished.")

if __name__ == "__main__":
    migrate()
