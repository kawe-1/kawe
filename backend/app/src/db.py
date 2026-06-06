import sqlite3
import os
import json
from typing import Optional, List, Dict, Any

DB_PATH = os.getenv("SQLITE_DB_PATH", "data/kawe.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sources (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                name TEXT NOT NULL,
                source_type TEXT NOT NULL,
                path_or_url TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS artifacts (
                session_id TEXT NOT NULL,
                artifact_type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (session_id, artifact_type),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                result TEXT,
                error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
    conn.close()

def create_session(session_id: str, title: str):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT INTO sessions (id, title) VALUES (?, ?);",
            (session_id, title)
        )
    conn.close()

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM sessions WHERE id = ?;", (session_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def list_sessions() -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM sessions ORDER BY created_at DESC;").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_session(session_id: str):
    conn = get_connection()
    with conn:
        conn.execute("DELETE FROM sessions WHERE id = ?;", (session_id,))
    conn.close()

def create_source(source_id: str, session_id: str, name: str, source_type: str, path_or_url: str, status: str = 'pending'):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT INTO sources (id, session_id, name, source_type, path_or_url, status) VALUES (?, ?, ?, ?, ?, ?);",
            (source_id, session_id, name, source_type, path_or_url, status)
        )
    conn.close()

def update_source_status(source_id: str, status: str):
    conn = get_connection()
    with conn:
        conn.execute(
            "UPDATE sources SET status = ? WHERE id = ?;",
            (status, source_id)
        )
    conn.close()

def get_source(source_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM sources WHERE id = ?;", (source_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def list_sources(session_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM sources WHERE session_id = ? ORDER BY created_at DESC;",
        (session_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_source(source_id: str):
    conn = get_connection()
    with conn:
        conn.execute("DELETE FROM sources WHERE id = ?;", (source_id,))
    conn.close()

def save_artifact(session_id: str, artifact_type: str, content: Dict[str, Any]):
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO artifacts (session_id, artifact_type, content)
            VALUES (?, ?, ?)
            ON CONFLICT(session_id, artifact_type) DO UPDATE SET content = excluded.content;
            """,
            (session_id, artifact_type, json.dumps(content))
        )
    conn.close()

def get_artifact(session_id: str, artifact_type: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute(
        "SELECT content FROM artifacts WHERE session_id = ? AND artifact_type = ?;",
        (session_id, artifact_type)
    ).fetchone()
    conn.close()
    if row:
        return json.loads(row["content"])
    return None

def add_chat_message(message_id: str, session_id: str, role: str, message: str):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT INTO chat_history (id, session_id, role, message) VALUES (?, ?, ?, ?);",
            (message_id, session_id, role, message)
        )
    conn.close()

def get_chat_history(session_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at ASC;",
        (session_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_job(job_id: str, status: str = 'processing'):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT INTO jobs (id, status) VALUES (?, ?);",
            (job_id, status)
        )
    conn.close()

def update_job(job_id: str, status: str, result: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
    conn = get_connection()
    result_str = json.dumps(result) if result is not None else None
    with conn:
        conn.execute(
            "UPDATE jobs SET status = ?, result = ?, error = ? WHERE id = ?;",
            (status, result_str, error, job_id)
        )
    conn.close()

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM jobs WHERE id = ?;", (job_id,)).fetchone()
    conn.close()
    if row:
        res = dict(row)
        if res.get("result"):
            res["result"] = json.loads(res["result"])
        return res
    return None
