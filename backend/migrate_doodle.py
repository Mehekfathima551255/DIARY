import sqlite3

def run_migration():
    conn = sqlite3.connect('smart_diary.db')
    cur  = conn.cursor()

    cur.execute("PRAGMA table_info(memories)")
    cols = [row[1] for row in cur.fetchall()]
    print("Existing columns in memories table:", cols)

    if "doodle_url" not in cols:
        cur.execute("ALTER TABLE memories ADD COLUMN doodle_url VARCHAR(255)")
        print("Added column: doodle_url")
    else:
        print("Already exists: doodle_url")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
