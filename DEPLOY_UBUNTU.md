# 🚀 คู่มือการนำแอพพลิเคชันไป Deploy บน Ubuntu Server

โปรเจกต์นี้เขียนด้วย **React + Vite (Frontend)** และ **Node.js Express (Backend Server)** รวมอยู่ในตัวเดียวกัน สามารถเลือก Deploy บน Ubuntu ได้ 2 วิธีหลัก:

---

## วิธีที่ 1: Deploy ด้วย Docker & Docker Compose (แนะนำ สะดวกและเสถียรที่สุด)

### 1.1 ติดตั้ง Docker & Docker Compose บน Ubuntu (หากยังไม่มี)
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

### 1.2 เตรียมไฟล์บน Ubuntu Server
1. คัดลอกโฟลเดอร์โปรเจกต์นี้ไปไว้ที่ Ubuntu (เช่น ผ่าน `git clone` หรือ `scp`)
2. เข้าไปในโฟลเดอร์:
   ```bash
   cd <project-folder>
   ```
3. สร้างไฟล์ `.env` สำหรับใส่ Gemini API Key:
   ```bash
   echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" > .env
   ```

### 1.3 สั่ง Build และรัน Container
```bash
docker-compose up -d --build
```
- ระบบจะ build และเปิด service ที่พอร์ต **3000**
- ตรวจสอบสถานะการทำงาน: `docker-compose ps` หรือ `docker logs -f tech-kb-app`
- สามารถเข้าใช้งานผ่านเบราว์เซอร์ได้ที่: `http://<IP_UBUNTU_SERVER>:3000`

---

## วิธีที่ 2: Deploy ตรงบน Ubuntu ด้วย Node.js + PM2

### 2.1 ติดตั้ง Node.js (แนะนำ Node v20 LTS) & PM2
```bash
# ติดตั้ง Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ติดตั้ง PM2 (Process Manager สำหรับคุม Service ให้รันตลอดเวลาและเปิดใหม่อัตโนมัติเมื่อ reboot)
sudo npm install -g pm2
```

### 2.2 ติดตั้ง Dependencies และ Build โปรเจกต์
```bash
cd <project-folder>

# ติดตั้งแพ็กเกจ
npm install

# Build หน้าบ้านและหลังบ้านเป็น Production Bundle (dist/)
npm run build
```

### 2.3 ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ใน root โฟลเดอร์:
```bash
nano .env
```
ใส่ค่า:
```env
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2.4 สั่งรันด้วย PM2
```bash
# รันแอพพลิเคชันผ่าน PM2
pm2 start ecosystem.config.cjs

# บันทึกสถานะและตั้งให้เริ่มทำงานอัตโนมัติเมื่อเซิร์ฟเวอร์ Restart
pm2 save
pm2 startup
```
- ดูสถานะ: `pm2 status`
- ดู Log: `pm2 logs tech-kb`

---

## 🔒 แนะนำเพิ่มเติม: ตั้งค่า Nginx เป็น Reverse Proxy (พอร์ต 80 / SSL 443)

หากต้องการให้เข้าเว็บผ่าน `http://your-domain-or-ip` โดยไม่ต้องพิมพ์ `:3000`:

1. ติดตั้ง Nginx:
   ```bash
   sudo apt install -y nginx
   ```
2. แก้ไขไฟล์คอนฟิก `/etc/nginx/sites-available/default`:
   ```nginx
   server {
       listen 80;
       server_name _;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. สั่งทดสอบและรีสตาร์ท Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```
