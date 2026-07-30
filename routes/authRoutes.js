const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { readData, writeData, logActivity } = require('../utils/jsonDb');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
  filename: (req, file, cb) => cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

router.post('/register', upload.single('profilePicture'), async (req, res) => {
  try {
    const { fullName, username, password, confirmPassword, phone, position } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Konfirmasi password tidak cocok!" });
    }

    const users = readData('users');
    const requests = readData('account_requests');
    if (users.find(u => u.username === username) || requests.find(r => r.username === username)) {
      return res.status(400).json({ success: false, message: "Username sudah terdaftar atau dalam antrean!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePath = req.file ? `/uploads/profiles/${req.file.filename}` : '/uploads/profiles/default.png';

    const newRequest = {
      id: Date.now(),
      fullName,
      username,
      password: hashedPassword,
      phone,
      position,
      role: "User",
      status: "PENDING",
      profilePicture: profilePath,
      createdAt: new Date().toISOString()
    };

    requests.push(newRequest);
    writeData('account_requests', requests);

    logActivity(username, "REGISTER", "Pengajuan akun baru terkirim");
    res.json({ success: true, message: "Pendaftaran berhasil! Menunggu persetujuan admin." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan sistem." });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readData('users');
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(400).json({ success: false, message: "Username atau password salah!" });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, message: "Akun belum disetujui atau dinonaktifkan!" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Username atau password salah!" });
  }

  req.session.user = {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    position: user.position,
    profilePicture: user.profilePicture
  };

  logActivity(username, "LOGIN", "Berhasil login ke sistem");
  res.json({ success: true, user: req.session.user });
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });
  res.json({ success: true, user: req.session.user });
});

router.post('/logout', (req, res) => {
  if (req.session.user) logActivity(req.session.user.username, "LOGOUT", "Logout dari sistem");
  req.session.destroy();
  res.json({ success: true, message: "Berhasil logout." });
});

module.exports = router;