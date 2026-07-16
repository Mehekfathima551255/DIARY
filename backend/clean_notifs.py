import sqlite3

conn = sqlite3.connect('smart_diary.db')
cur  = conn.cursor()

# Remove duplicate notifications — keep only the latest per message per user
cur.execute("""
    DELETE FROM notifications
    WHERE id NOT IN (
        SELECT MAX(id) FROM notifications
        GROUP BY user_id, message
    )
""")
deleted = cur.rowcount
conn.commit()
conn.close()
print(f"Removed {deleted} duplicate notification(s).")
