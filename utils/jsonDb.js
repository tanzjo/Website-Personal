const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../database');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const getFilePath = (fileName) => path.join(DB_DIR, `${fileName}.json`);

const initJsonFile = (fileName, initialData = []) => {
  const filePath = getFilePath(fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
};

['users', 'attendance', 'password_requests', 'account_requests', 'activity_logs', 'settings'].forEach(file => {
  initJsonFile(file, file === 'settings' ? { companyName: "Minahasa Highland", workStartTime: "08:00" } : []);
});

const readData = (file) => {
  try {
    const filePath = getFilePath(file);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeData = (file, data) => {
  const filePath = getFilePath(file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const logActivity = (username, action, details) => {
  const logs = readData('activity_logs');
  logs.unshift({
    id: Date.now(),
    username,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  writeData('activity_logs', logs);
};

module.exports = { readData, writeData, logActivity };