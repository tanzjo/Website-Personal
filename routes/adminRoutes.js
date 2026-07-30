const express = require('express');
const router = express.Router();
const { readData, writeData, logActivity } = require('../utils/jsonDb');
const { checkAuth, checkRole } = require('../middleware/auth');

router.use(checkAuth, checkRole(['Super Admin', 'Admin']));

router.get('/stats', (req, res) => {
  const users = readData('users');
  const requests = readData('account_requests');
  const attendance = readData('attendance');
  const today = new Date().toISOString().split('T')[0];

  const todayAttendance = attendance.filter(a => a.tanggal === today);

  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      pendingUsers: requests.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
      hadirHariIni: todayAttendance.length,
      terlambatHariIni: todayAttendance.filter(a => a.status === 'Terlambat').length
    }
  });
});

router.get('/account-requests', (req, res) => {
  res.json({ success: true, data: readData('account_requests') });
});

router.post('/approve-account', (req, res) => {
  const { requestId } = req.body;
  let requests = readData('account_requests');
  let users = readData('users');

  const reqUser = requests.find(r => r.id === Number(requestId));
  if (!reqUser) return res.status(404).json({ success: false, message: "Permintaan tidak ditemukan" });

  reqUser.status = "ACTIVE";
  users.push(reqUser);
  requests = requests.filter(r => r.id !== Number(requestId));

  writeData('users', users);
  writeData('account_requests', requests);

  logActivity(req.session.user.username, "APPROVE_USER", `Menyetujui akun: ${reqUser.username}`);
  res.json({ success: true, message: "Akun disetujui & diaktifkan!" });
});

router.post('/reject-account', (req, res) => {
  const { requestId } = req.body;
  let requests = readData('account_requests');
  requests = requests.filter(r => r.id !== Number(requestId));
  
  writeData('account_requests', requests);
  res.json({ success: true, message: "Permintaan ditolak." });
});

router.get('/all-attendance', (req, res) => {
  res.json({ success: true, data: readData('attendance') });
});

module.exports = router;