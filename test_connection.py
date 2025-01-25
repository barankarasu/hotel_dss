import MySQLdb

try:
    connection = MySQLdb.connect(
        host='127.0.0.1',
        user='root',
        passwd='',  # Şifreni buraya ekle
        db='hotel_dss'
    )
    print("MySQL bağlantısı başarılı!")
except Exception as e:
    print("Bağlantı hatası:", e)
finally:
    if 'connection' in locals():
        connection.close()
        print("Bağlantı kapatıldı.")
