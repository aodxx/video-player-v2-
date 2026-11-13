## สรุป

อธิบายสิ่งที่เปลี่ยนและผลลัพธ์ต่อผู้ใช้

## ปัญหา / Issue

- ปัญหาหรือเหตุผล:
- Acceptance criteria:
- Issue: `Closes #...` (ถ้ามี)

## การเปลี่ยนแปลง

- ไฟล์/ส่วนที่แก้:
- สิ่งที่ตั้งใจไม่แตะ:

## การตรวจสอบ

- [ ] เพิ่มหรือปรับ regression tests ตามพฤติกรรมที่เปลี่ยน
- [ ] `npm run check` ผ่าน
- [ ] ตรวจ diff และไม่มี secret/credential
- [ ] หากแก้ UI: ตรวจ desktop และ mobile; แนบภาพหรืออธิบายผล

ผลคำสั่ง/CI และกรณีที่ยังไม่ได้ตรวจ:

## ข้อมูล catalogue (ถ้ามี)

- แหล่งที่มาและวิธีตรวจ:
- จำนวนแถวใหม่ / duplicate check:
- ยืนยัน URL และ metadata แล้วหรือไม่:

## ความปลอดภัยและผลกระทบ

- ผลต่อ Worker, CORS, Range, secrets หรือข้อมูลผู้ใช้:
- หากไม่เกี่ยวข้อง ให้ระบุว่าไม่เปลี่ยน

## Deploy / rollback

- [ ] GitHub Pages / static files
- [ ] Cloudflare Worker (ระบุเหตุผลและผู้อนุมัติ)
- [ ] ไม่ต้อง deploy

วิธีตรวจหลัง deploy และ rollback ที่เหมาะสม:

## Checklist ผู้ส่ง PR

- [ ] PR ทำเรื่องเดียวและชื่อสื่อความหมาย
- [ ] README / CHANGELOG / version อัปเดตเมื่อจำเป็น
- [ ] รอ CI และ maintainer review ก่อน merge
