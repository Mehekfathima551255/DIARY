import sqlite3

db_path = 'smart_diary.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("PRAGMA table_info(memories)")
cols = [row[1] for row in cur.fetchall()]

if 'audio_url' not in cols:
    cur.execute('ALTER TABLE memories ADD COLUMN audio_url VARCHAR(255)')
    conn.commit()
    print('audio_url column added successfully.')
else:
    print('audio_url column already exists — nothing to do.')

conn.close()
