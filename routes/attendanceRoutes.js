const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { readData, writeData, logActivity } = require('../utils/jsonDb');
const { checkAuth } = require('../middleware/auth');

const saveBase64Image = (base64Data, prefix) => {
  const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) return null;
  
  const ext = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const filePath = path.join(__dirname, '../uploads/attendance', filename);
  
  fs.writeFileSync(filePath, buffer);
  return `/uploads/attendance/${filename}`;
};

router.post('/check-in', checkAuth, (req, res) => {
  const { selfieImage, latitude, longitude, device, browser } = req.body;
  const username = req.session.user.username;
  const today = new Date().toISOString().split('T')[0];

  if (!selfieImage) return res.status(400).json({ success: false, message: "Foto selfie wajib diambil!" });
  if (!latitude || !longitude) return res.status(400).json({ success: false, message: "GPS wajib diaktifkan!" });

  const attendanceList = readData('attendance');
  const existingToday = attendanceList.find(a => a.username === username && a.tanggal === today);

  if (existingToday && existingToday.jamMasuk) {
    return res.status(400).json({ success: false, message: "Anda sudah melakukan absen masuk hari ini!" });
  }

  const photoUrl = saveBase64Image(selfieImage, `checkin-${username}`);
  const jamMasuk = new Date().toTimeString().split(' ')[0];

  const newRecord = {
    id: Date.now(),
    fullName: req.session.user.fullName,
    username,
    tanggal: today,
    jamMasuk,
    jamPulang: null,
    fotoMasuk: photoUrl,
    fotoPulang: null,
    latitude,
    longitude,
    browser: browser || 'Unknown Browser',
    device: device || 'Unknown Device',
    status: jamMasuk > "08:15:00" ? "Terlambat" : "Hadir"
  };

  attendanceList.push(newRecord);
  writeData('attendance', attendanceList);
  logActivity(username, "CHECK_IN", `Absen masuk jam ${jamMasuk}`);

  res.json({ success: true, message: "Absen Masuk Berhasil!", record: newRecord });
});

router.post('/check-out', checkAuth, (req, res) => {
  const { selfieImage } = req.body;
  const username = req.session.user.username;
  const today = new Date().toISOString().split('T')[0];

  const attendanceList = readData('attendance');
  const index = attendanceList.findIndex(a => a.username === username && a.tanggal === today);

  if (index === -1 || !attendanceList[index].jamMasuk) {
    return res.status(400).json({ success: false, message: "Anda belum absen masuk hari ini!" });
  }

  if (attendanceList[index].jamPulang) {
    return res.status(400).json({ success: false, message: "Anda sudah absen pulang hari ini!" });
  }

  const photoUrl = saveBase64Image(selfieImage, `checkout-${username}`);
  const jamPulang = new Date().toTimeString().split(' ')[0];

  attendanceList[index].jamPulang = jamPulang;
  attendanceList[index].fotoPulang = photoUrl;

  writeData('attendance', attendanceList);
  logActivity(username, "CHECK_OUT", `Absen pulang jam ${jamPulang}`);

  res.json({ success: true, message: "Absen Pulang Berhasil!" });
});

router.get('/my-history', checkAuth, (req, res) => {
  const attendanceList = readData('attendance');
  const myLogs = attendanceList.filter(a => a.username === req.session.user.username);
  res.json({ success: true, data: myLogs });
});

module.exports = router;