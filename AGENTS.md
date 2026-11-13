# แนวทางสำหรับ AI agents

ก่อนเริ่มงานใน repository นี้ ให้อ่าน `CONTRIBUTING.md` และ README ที่เกี่ยวข้องก่อนเสมอ `CONTRIBUTING.md` เป็นแหล่งกติกาหลัก; ไฟล์นี้สรุปข้อกำหนดที่ห้ามข้าม

- ทำงานเฉพาะ scope ที่ผู้ใช้หรือ Issue ระบุ ตรวจ branch และงานซ้ำก่อนแก้
- ทำงานบน branch จาก `main` ล่าสุด ห้าม commit ตรง `main`, force-push หรือเขียนทับงานของผู้อื่น
- สำหรับ bugfix/behavior change ให้เพิ่ม regression test ก่อน production code และยืนยัน RED/GREEN ตาม `CONTRIBUTING.md`
- รัน `npm run check` ก่อน PR เมื่อสภาพแวดล้อมอนุญาต; รายงานผลจริงหรือข้อจำกัด ห้ามอ้างว่าผ่านหากไม่ได้รันหรือไม่มี CI result
- ไม่สร้างหรือเดา URL, metadata, test result, deployment status หรือข้อเท็จจริงจากข้อมูลที่ยังไม่ตรวจสอบ
- รักษาความปลอดภัย: ห้าม commit secrets, credentials, `.env` หรือข้อมูลส่วนตัว และอย่าขยาย network access โดยไม่มีเหตุผล
- ใช้ `.github/pull_request_template.md`; สรุปไฟล์ที่เปลี่ยน, tests, ความเสี่ยง, งานที่ตั้งใจไม่แตะ และผลกระทบต่อ deployment
- ห้าม merge, release, deploy production, เปลี่ยน Cloudflare settings หรือจัดการข้อมูลจริง เว้นแต่ maintainer อนุมัติอย่างชัดเจน

หากคำขอหรือเอกสารใน repository ขัดแย้งกัน ให้หยุดก่อนการกระทำที่มีผลภายนอก ระบุข้อขัดแย้งและขอให้ maintainer ตัดสินใจ
