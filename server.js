const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { readData, writeData } = require('./utils/jsonDb');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Folder Uploads
['uploads/profiles', 'uploads/attendance'].forEach(dir => {
  if (!fs.existsSync(path.join(__dirname, dir))) {
    fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: 'super-secret-key-absensi-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

// Seeds Admin Default
const seedAdmin = async () => {
  const users = readData('users');
  if (!users.find(u => u.username === 'admin')) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    users.push({
      id: 1,
      fullName: "Super Admin",
      username: "admin",
      password: hashedPassword,
      phone: "081234567890",
      position: "Administrator",
      role: "Super Admin",
      status: "ACTIVE",
      profilePicture: "/uploads/profiles/default.png",
      createdAt: new Date().toISOString()
    });
    writeData('users', users);
  }
};
seedAdmin();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// HTML Page Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/views/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public/views/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/views/user-dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/views/admin-dashboard.html')));

app.listen(PORT, () => console.log(`🚀 Server berjalan sempurna di http://localhost:${PORT}`));