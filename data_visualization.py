import mysql.connector
from mysql.connector import Error
import matplotlib.pyplot as plt

# Veritabanından performans verilerini çekme
def fetch_performance_data():
    print("Veritabanına bağlanma işlemi başlatılıyor...")
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3306,
            user='root',
            password='',  # Şifreni buraya yazmayı unutmaS
            database='hotel_dss'
        )

        if connection.is_connected():
            print("Veritabanına başarıyla bağlanıldı!")
            cursor = connection.cursor(dictionary=True)
            print("Performans verileri çekiliyor...")
            cursor.execute("""
                SELECT h.name AS hotel_name, p.occupancy_rate, p.revenue, p.cost
                FROM performance p
                JOIN hotels h ON p.hotel_id = h.id
            """)
            records = cursor.fetchall()
            print("Veriler başarıyla çekildi:", records)
            return records

    except Error as e:
        print("Hata oluştu:", e)
        return []

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("Veritabanı bağlantısı kapatıldı.")

# Veriyi çek ve grafikleri oluştur
def plot_data():
    print("Performans verileri çekiliyor...")
    data = fetch_performance_data()

    if not data:
        print("Veri çekilemedi, işlem iptal edildi.")
        return

    print("Veriler grafiğe hazırlanıyor...")
    # Kârlılık ve doluluk oranı verilerini ayrıştır
    hotel_names = [row['hotel_name'] for row in data]
    profits = [row['revenue'] - row['cost'] for row in data]
    occupancy_rates = [row['occupancy_rate'] for row in data]

    # Kârlılık Grafiği
    print("Kârlılık grafiği oluşturuluyor...")
    plt.figure(figsize=(10, 5))
    plt.bar(hotel_names, profits, color='skyblue')
    plt.title("Otel Kârlılık Durumu")
    plt.xlabel("Oteller")
    plt.ylabel("Kârlılık (TL)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

    # Doluluk Oranı Grafiği
    print("Doluluk oranı grafiği oluşturuluyor...")
    plt.figure(figsize=(10, 5))
    plt.bar(hotel_names, occupancy_rates, color='orange')
    plt.title("Otel Doluluk Oranları")
    plt.xlabel("Oteller")
    plt.ylabel("Doluluk Oranı (%)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

    print("Grafikler başarıyla oluşturuldu!")

# Ana program
if __name__ == "__main__":
    print("Program başlatıldı.")
    plot_data()
    print("Program tamamlandı.")
