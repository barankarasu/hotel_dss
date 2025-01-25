const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Statik dosya servisi
app.use(express.static(path.join(__dirname, '../frontend')));

// MySQL Veritabanı Bağlantısı
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hotel_dss'
});

// Veritabanı Bağlantısı
db.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
  } else {
    console.log('MySQL veritabanına başarıyla bağlanıldı.');
  }
});

// Statik HTML Sayfaları için Rotalar
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/map.html'));
});

app.get('/performance', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/performance.html'));
});

app.get('/hotel-performance', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/hotel-performance.html'));
});

app.get('/employee-performance', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/employee-performance.html'));
});

app.get('/infrastructure-performance', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/infrastructure-performance.html'));
});

app.get('/touristic-areas', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/touristic-areas.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/reports.html'));
});

// API Endpoint: Demografik Verileri Getir
app.get('/api/area-data', (req, res) => {
  const areaName = req.query.name;

  if (!areaName) {
    return res.status(400).json({ error: 'Alan adı gerekli.' });
  }

  const query = `
    SELECT ta.name AS area_name, d.annual_tourist_count, 
           d.nationality_distribution, d.average_stay_duration, 
           d.spending_per_person
    FROM tourist_areas ta
    JOIN demographics d ON ta.id = d.area_id
    WHERE ta.name = ?
  `;

  db.query(query, [areaName], (err, results) => {
    if (err) {
      console.error('Demografik veri sorgu hatası:', err);
      return res.status(500).json({ error: 'Demografik veriler alınamadı.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Veri bulunamadı' });
    }

    const data = results[0];
    data.nationality_distribution = JSON.parse(data.nationality_distribution);

    res.json(data);
  });
});

// API Endpoint: Hotel Performance Verilerini Getir
app.get('/api/hotel-performance', (req, res) => {
  const query = `
    SELECT name, revenue, rating
    FROM hotels_own
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Sorgu hatası (hotel-performance):', err);
      return res.status(500).json({ error: 'Hotel performans verileri alınamadı.' });
    }

    res.json(results);
  });
});

// Yeni Endpoint: Belirli Şehirdeki Otellerin Performansını Getir
app.get('/api/hotels-own', (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({ error: 'City parameter is required.' });
  }

  const query = `
    SELECT name, revenue, rating, latitude, longitude
    FROM hotels_own
    WHERE city = ?
  `;

  db.query(query, [city], (err, results) => {
    if (err) {
      console.error('Sorgu hatası (hotels-own):', err);
      return res.status(500).json({ error: 'Failed to fetch hotel performance data.' });
    }

    res.json(results);
  });
});

// API Endpoint: Employee Verilerini Getir
app.get('/api/employees', (req, res) => {
  const query = `
    SELECT e.id, e.name, ho.name AS hotel_name, e.performance_score, e.last_evaluation_date
    FROM employees e
    LEFT JOIN hotels_own ho ON e.hotel_id = ho.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Sorgu hatası (employees):', err);
      return res.status(500).json({ error: 'Çalışan verileri alınamadı.' });
    }

    res.json(results);
  });
});

app.get('/api/region-cities', (req, res) => {
  const region = req.query.region;
  const query = 'SELECT * FROM cities WHERE region = ?';
  db.query(query, [region], (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
  });
});


// API Endpoint: Infrastructure Verilerini Getir
app.get('/api/infrastructure', (req, res) => {
  const query = `
      SELECT region_name, suitability_score, water_supply, electricity_supply, 
             internet_quality, road_quality, latitude, longitude 
      FROM infrastructure
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Infrastructure verisi sorgu hatası:', err);
          return res.status(500).json({ error: 'Veriler alınamadı.' });
      }

      res.json(results);
  });
});

// Reports Bölümü
app.get('/api/reports', (req, res) => {
  const query = 'SELECT * FROM reports';
  db.query(query, (err, results) => {
      if (err) {
          console.error('Database error:', err);
          res.status(500).send('Error fetching reports');
      } else {
          res.json(results);
      }
  });
});

// Yeni Endpoint: Rapor Kaydet
app.post('/api/reports/save', (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Rapor içeriği boş olamaz.' });
  }

  const query = 'INSERT INTO reports (content) VALUES (?)';

  db.query(query, [content], (err, result) => {
    if (err) {
      console.error('Rapor kaydetme hatası:', err);
      return res.status(500).json({ error: 'Rapor kaydedilemedi.' });
    }

    res.status(201).json({ message: 'Rapor başarıyla kaydedildi.', id: result.insertId });
  });
});

// Yeni Endpoint: Admin Raporunu Kaydet
app.post('/api/admin-reports', (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Rapor içeriği boş olamaz.' });
  }

  const query = 'INSERT INTO admin_reports (content) VALUES (?)';

  db.query(query, [content], (err, result) => {
    if (err) {
      console.error('Admin rapor kaydetme hatası:', err);
      return res.status(500).json({ error: 'Admin raporu kaydedilemedi.' });
    }

    res.status(201).json({ message: 'Admin raporu başarıyla kaydedildi.', id: result.insertId });
  });
});

// Yeni Endpoint: Admin Raporlarını Getir
app.get('/api/admin-reports', (req, res) => {
  const query = 'SELECT content FROM admin_reports ORDER BY created_at DESC LIMIT 1';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Veri çekme hatası (admin_reports):', err);
      return res.status(500).json({ error: 'Veriler alınamadı.' });
    }
    res.json(results[0] || { content: 'No report available' });
  });
});

// API Endpoint: Tüm Turistik Alanları Getir
app.get('/api/touristic-sites', (req, res) => {
  const query = `
    SELECT site_name, city_name, latitude, longitude, 
           population_density, annual_visitors, average_stay_days
    FROM touristic_sites
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Sorgu hatası (touristic-sites):', err);
      return res.status(500).json({ error: 'Turistik alan verileri alınamadı.' });
    }

    res.json(results);
  });
});

// API Endpoint: Belirli Bir Turistik Alanı Getir
app.get('/api/touristic-site', (req, res) => {
  const siteName = req.query.name;

  if (!siteName) {
    return res.status(400).json({ error: 'Alan adı gerekli.' });
  }

  const query = `
    SELECT site_name, city_name, latitude, longitude, 
           population_density, annual_visitors, average_stay_days
    FROM touristic_sites
    WHERE site_name = ?
  `;

  db.query(query, [siteName], (err, results) => {
    if (err) {
      console.error('Sorgu hatası (touristic-site):', err);
      return res.status(500).json({ error: 'Turistik alan verileri alınamadı.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Veri bulunamadı.' });
    }

    res.json(results[0]);
  });
});

// Genel Hata Mesajları için Middleware
app.use((req, res, next) => {
  res.status(404).json({ error: 'API bulunamadı.' });
});

// Sunucuyu Çalıştırma
app.listen(PORT, () => {
  console.log(`Node.js sunucusu çalışıyor: http://localhost:${PORT}`);
});
