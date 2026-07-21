import sqlite3

conn = sqlite3.connect('smart_diary.db')
cur  = conn.cursor()
cur.execute('DELETE FROM notifications')
deleted = cur.rowcount
conn.commit()
conn.close()
print(f'Cleared {deleted} notification(s). Fresh start!')
