import sqlite3

conn = sqlite3.connect('smart_diary.db')
cur  = conn.cursor()

cur.execute("PRAGMA table_info(memories)")
cols = [row[1] for row in cur.fetchall()]
print("Existing columns:", cols)

migrations = [
    ("is_private", "ALTER TABLE memories ADD COLUMN is_private BOOLEAN DEFAULT 0"),
    ("password",   "ALTER TABLE memories ADD COLUMN password VARCHAR(255)"),
    ("audio_url",  "ALTER TABLE memories ADD COLUMN audio_url VARCHAR(255)"),
    ("location",   "ALTER TABLE memories ADD COLUMN location VARCHAR(255)"),
    ("weather",    "ALTER TABLE memories ADD COLUMN weather VARCHAR(100)"),
]

for col, sql in migrations:
    if col not in cols:
        cur.execute(sql)
        print(f"Added column: {col}")
    else:
        print(f"Already exists: {col}")

conn.commit()
conn.close()
print("Migration complete.")
