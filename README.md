# Video Player v2

เว็บ static สำหรับค้นหาและเล่นวิดีโอจาก catalogue ใน `data/videos.txt` ผ่านหน้าเว็บ `index.html` และ Cloudflare Worker สำหรับ proxy วิดีโอ/ค้นหาคุณภาพสูง

## Playlist

Playlist แสดงทุกรายการในผลลัพธ์ปัจจุบันโดยไม่จำกัด 200 รายการ เลื่อนรายการได้ในแถบ Playlist และค้นหาแยกด้วยบัญชี วันที่ ข้อความ ลิงก์โพสต์ ยอดวิว ความยาว หรือหมายเลขรายการได้ การค้นหาใน Playlist จะกรองเฉพาะรายการที่มองเห็น โดยยังเปิดวิดีโอจากตำแหน่งเดิมในลำดับเล่น

## สิ่งที่ต้องมี

- Node.js 20 ขึ้นไป สำหรับตรวจ tests และข้อมูล
- Static hosting ที่เสิร์ฟไฟล์ `index.html`, `src/`, `data/` ได้ เช่น GitHub Pages
- Cloudflare Worker สำหรับ `?url=` และ `?hq=` ซึ่งตั้งค่าใน `src/app.js` ด้วยค่า `PROXY_PREFIX`

## ติดตั้งและตรวจในเครื่อง

```bash
npm test
npm run validate:data
npm run check
```

เปิดเว็บผ่าน HTTP static server ไม่ใช่ `file://` เพราะหน้าเว็บโหลด `data/videos.txt` ด้วย `fetch()`. ตัวอย่างจาก root ของ repository:

```bash
python3 -m http.server 8080
```

จากนั้นเปิด `http://localhost:8080` ในเบราว์เซอร์

## รูปแบบ catalogue

แต่ละบรรทัดใน `data/videos.txt` มีรูปแบบคั่นด้วย `|`:

```text
SOURCE|POSTED_AT|POST_URL|VIDEO_URL|THUMBNAIL_URL|DURATION_SECONDS|VIEWS|TEXT
```

`SOURCE` ต้องเป็น `SO`, `RW` หรือ `CX` (`@CxllmeB64`, Rabbit Rayong); URL วิดีโอต้องเป็น HTTPS บน `video.twimg.com`; ภาพปกว่างได้ หรือเป็น HTTPS บน `pbs.twimg.com`. โพสต์เดียวกันอาจมีหลายคลิป จึงตรวจรายการซ้ำจาก `VIDEO_URL` ไม่ใช่ `POST_URL`. ข้อความโพสต์มีเครื่องหมาย `|` ได้ เพราะ parser รวมส่วนที่เหลือกลับเป็นข้อความเดิม ตรวจ catalogue ก่อนเผยแพร่ด้วย `npm run validate:data`; validator รายงานข้อผิดพลาดโดยไม่แก้หรือลบแถวเอง

## Worker และข้อควรระวัง

`worker.js` รับเฉพาะ `GET`, `HEAD`, `OPTIONS`. Endpoint `?url=` ยอมรับ HTTPS จาก `video.twimg.com` เท่านั้น และจะตรวจทุก redirect โดยบล็อก host อื่นและจำกัดจำนวน redirect. การส่งต่อ Range/206 ยังคงไว้เพื่อให้ seek ได้. Endpoint `?hq=` ใช้ Syndication API และ fxTwitter เป็นแหล่ง fallback; แหล่งข้อมูลภายนอกเหล่านี้อาจเปลี่ยนรูปแบบหรือปิดให้บริการได้

Worker ยังเป็น public endpoint และ CORS เปิดให้เรียกจากทุก origin. ก่อนเปิดเผย URL ต่อสาธารณะ ให้ตั้ง Cloudflare rate-limiting rule/ข้อจำกัดตามแผนและตรวจ analytics เพื่อป้องกันการใช้ bandwidth เกินคาด. อย่าตั้ง cache สำหรับวิดีโอแบบเต็มโดยไม่ทดสอบ byte-range, 206 และ 416. อย่าใส่ secret ใน source หรือ repository

## การเผยแพร่

1. รัน `npm run check` และตรวจ diff กับข้อมูลต้นฉบับ
2. Deploy `worker.js` ไป Cloudflare Worker เดิม โดยตรวจ URL ที่ตั้งไว้ใน `src/app.js` ว่าตรงกับ Worker จริง
3. ทดสอบ OPTIONS, GET, HEAD, Range/seek, redirect ไปยัง host ที่อนุญาต และ redirect ที่ออกนอกโดเมน
4. Publish ไฟล์ static ทั้งชุด โดยให้ `data/videos.txt` และ `src/` อยู่ใน deployment เดียวกับ `index.html`
5. ตรวจค้นหา/กรอง, เล่น/เปลี่ยนคลิป, fallback คุณภาพ, รายการโปรด และ playlist บน Android Chrome และ desktop
6. ถ้าระบบ hosting publish จาก GitHub branch อัตโนมัติ ให้ยืนยัน branch และ URL เป้าหมายก่อน merge หรือเปลี่ยน production

การเปลี่ยน schema ของข้อมูลภายหลังควรรองรับข้อมูลเดิมหรือจัดทำ migration ก่อน deploy เพื่อไม่ให้ catalogue ว่าง
