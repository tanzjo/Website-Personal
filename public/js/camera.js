class CameraHandler {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.stream = null;
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      this.video.srcObject = this.stream;
      return true;
    } catch (err) {
      alert("Akses kamera ditolak/tidak ditemukan!");
      return false;
    }
  }

  takeSnapshot() {
    if (!this.stream) return null;
    const ctx = this.canvas.getContext('2d');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  static getGPS() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("Geolocation tidak didukung browser ini.");
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject("GPS Wajib diaktifkan untuk absen!"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}