import sqlite3
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(courses_courseenrollment)")
for row in cursor.fetchall():
    print(row)
