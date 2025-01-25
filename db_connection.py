import mysql.connector
from mysql.connector import Error

# MySQL veritabanına bağlantı
try:
    connection = mysql.connector.connect(
        host='localhost',       # MySQL sunucu adresi
        user='root',            # MySQL kullanıcı adı
        password='',            # MySQL şifresi
        database='hotel_dss'    # Veritabanı adı
    )

    if connection.is_connected():
        print("Veritabanına başarıyla bağlandı!")

        cursor = connection.cursor(dictionary=True)

        # 1. Otel Bilgilerini Çek
        print("\n--- Otel Bilgileri ---")
        cursor.execute("SELECT * FROM hotels;")
        hotel_records = cursor.fetchall()
        for row in hotel_records:
            print(f"Otel Adı: {row['name']}, Lokasyon: {row['location']}, Tip: {row['type']}, Kapasite: {row['capacity']}")

        # 2. Performans Verilerini Çek (JOIN ile otel isimleriyle birlikte)
        print("\n--- Otel Performans Verileri ---")
        cursor.execute("""
            SELECT p.id, h.name AS hotel_name, p.date, p.occupancy_rate, p.revenue, p.cost
            FROM performance p
            JOIN hotels h ON p.hotel_id = h.id
        """)
        performance_records = cursor.fetchall()
        for row in performance_records:
            print(f"Otel: {row['hotel_name']}, Tarih: {row['date']}, Doluluk Oranı: {row['occupancy_rate']}%, "
                  f"Gelir: {row['revenue']} TL, Maliyet: {row['cost']} TL")

        # 3. Kârlılık Hesaplama
        print("\n--- Otel Kârlılık Durumu ---")
        for row in performance_records:
            profit = row['revenue'] - row['cost']
            print(f"Otel: {row['hotel_name']}, Tarih: {row['date']}, Kârlılık: {profit} TL")

except Error as e:
    print("Hata:", e)

finally:
    if 'connection' in locals() and connection.is_connected():
        cursor.close()
        connection.close()
        print("\nMySQL bağlantısı kapatıldı.")
