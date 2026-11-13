# คู่มือการมีส่วนร่วม

เอกสารนี้เป็นแนวทางหลักสำหรับทุกคนที่แก้ repository นี้ ไม่ว่าจะเป็นสมาชิกทีม ผู้ตรวจโค้ด หรือ AI agent หาก `AGENTS.md`, README หรือเทมเพลตให้รายละเอียดซ้ำกัน ให้ยึดกติกาในไฟล์นี้เป็นหลัก และเสนอ PR เพื่อแก้เอกสารเมื่อพบว่าขั้นตอนจริงเปลี่ยนไป

## เส้นทางทำงานมาตรฐาน

1. **กำหนดปัญหาและผลลัพธ์ที่ยอมรับได้** — เริ่มจาก Issue เมื่อมีอยู่แล้ว หากยังไม่มี ให้ระบุบริบท อาการ และ acceptance criteria ใน PR
2. **ตรวจบริบทก่อนแก้** — อ่าน README และไฟล์ที่เกี่ยวข้อง ตรวจสถานะ branch และค้นว่ามีงานซ้ำหรือไม่ จำกัดขอบเขตให้ตรงกับคำขอ
3. **สร้าง branch จาก `main` ล่าสุด** — ห้ามทำงานหรือ commit ตรงบน `main`
4. **ทำ test-first สำหรับพฤติกรรมที่เปลี่ยน** — เพิ่ม regression test ก่อน implementation, ตรวจว่า test แสดงอาการที่ต้องแก้, แล้วแก้ให้น้อยที่สุด
5. **ตรวจและทดสอบ** — รัน `npm run check` จาก root ก่อนส่ง PR; คำสั่งนี้ตรวจ syntax, test suite และ catalogue validator
6. **ทบทวน diff** — ตรวจไฟล์ที่เปลี่ยน, whitespace, secret, source/provenance และผลกระทบที่อยู่นอก scope
7. **เปิด PR ด้วยเทมเพลต** — เติม `.github/pull_request_template.md`, เชื่อม Issue ถ้ามี และรอ CI ผ่านกับการ review
8. **ให้ maintainer อนุมัติและ merge** — ผู้ทำงานไม่ merge, publish หรือ deploy production เอง เว้นแต่ maintainer อนุมัติอย่างชัดเจน
9. **ตรวจหลังเผยแพร่** — สำหรับ static site ให้ตรวจ Pages URL และฟีเจอร์ที่เปลี่ยน; Worker เป็นการ deploy แยกและต้องตรวจเฉพาะเมื่อ PR แก้ Worker

## Branch และ commit

ใช้ branch สั้น ๆ ที่ตั้งชื่อตามงาน:

- `feat/<short-name>` — เพิ่มความสามารถ
- `fix/<short-name>` — แก้บั๊ก
- `docs/<short-name>` — เอกสาร
- `test/<short-name>` — tests อย่างเดียว
- `chore/<short-name>` หรือ `refactor/<short-name>` — tooling หรือ refactor

ใช้ Conventional Commit แบบสั้นและอธิบายเหตุผลเมื่อจำเป็น เช่น `fix: show full searchable playlist`, `test: cover playlist search` หรือ `docs: add contributor workflow`. แยก commits ตามเหตุผลเดียว ไม่รวม refactor ที่ไม่เกี่ยวข้องเข้ากับ bugfix

ห้าม force-push branch ที่คนอื่นใช้อยู่, ห้ามเขียนทับงานของผู้อื่น และห้าม commit secrets, tokens, `.env`, credentials หรือข้อมูลส่วนตัว

## การพัฒนาและตรวจสอบ

โปรเจกต์เป็น static app ใช้ JavaScript ES modules และ Node.js 20 ขึ้นไป ไม่มี runtime dependency เพิ่มโดยไม่จำเป็น ติดตั้งและตรวจได้จาก root:

```bash
npm ci
npm run check
```

`npm run check` รัน syntax checks, `node --test` และ `npm run validate:data`. หากแก้เฉพาะข้อมูล ใช้ `npm run validate:data` เพิ่มได้ แต่ต้องตรวจแหล่งที่มาของข้อมูลด้วยตนเองเสมอ อย่ารายงานว่า test ผ่านจนกว่าจะมีผลจากคำสั่งหรือ CI จริง

สำหรับพฤติกรรมใหม่หรือ bugfix:

- เขียน regression test ที่จับอาการจริงก่อน implementation และตรวจ RED ที่เกิดจากพฤติกรรมที่ยังไม่มี ไม่ใช่ syntax/setup error
- implement ให้เล็กและตรง acceptance criteria แล้วตรวจ GREEN พร้อม regression tests เดิม
- หากทดสอบบางกรณีไม่ได้ ให้ระบุเหตุผลและสิ่งที่ยังไม่ได้ยืนยันใน PR แทนการคาดเดา

สำหรับ UI ให้ตรวจทั้ง desktop และ mobile รวมถึง filter/search, การเล่นวิดีโอ, keyboard/focus และกรณีไม่มีผลลัพธ์ตามส่วนที่แก้ หากเปลี่ยน UI ที่เผยแพร่แล้ว ให้ตรวจหน้า live หลัง deployment เมื่อทำได้

## กติกาเฉพาะ repository

### Catalogue และวิดีโอ

- รูปแบบแถวอยู่ใน `README.md` และ `data/videos.txt`; อย่าเปลี่ยน schema โดยไม่เพิ่ม migration/compatibility tests
- เพิ่ม source ใหม่ต้องอัปเดต parser ใน `src/catalog.js`, filter/badge/UI ที่เกี่ยวข้อง และ tests ให้สอดคล้องกัน
- ตรวจรายการซ้ำด้วย `VIDEO_URL` ไม่ใช่ `POST_URL`; โพสต์หนึ่งรายการอาจมีวิดีโอหลายไฟล์
- ยืนยัน URL และ metadata จากแหล่งที่ได้รับอนุญาต ห้ามเดา timestamp, duration, views หรือ URL; เก็บ post link เพื่อให้ตรวจย้อนกลับได้
- วิดีโอต้องใช้ HTTPS จาก `video.twimg.com`; thumbnail ถ้ามีต้องใช้ HTTPS จาก `pbs.twimg.com`

### Player และ Cloudflare Worker

- ห้ามเปลี่ยน `PROXY_PREFIX`, Worker behavior, CORS หรือ runtime settings โดยไม่อยู่ใน scope และไม่มีเหตุผลชัดเจน
- เมื่อแก้ Worker ให้เพิ่ม regression tests สำหรับ host allowlist/redirect และรักษา `Range`, `206`, `HEAD` และ error behavior ที่เกี่ยวข้อง
- การ deploy Worker แยกจาก GitHub Pages; ห้ามถือว่า merge เว็บหมายถึง Worker ถูก deploy แล้ว

## Pull request และ review

ใช้ `.github/pull_request_template.md` ทุกครั้ง PR ต้องอธิบายปัญหา, วิธีแก้, tests พร้อมผลจริง, data provenance เมื่อเปลี่ยน catalogue, ความเสี่ยง/security และแผน deploy/rollback

ก่อน merge ต้องมี CI ผ่าน และ review จาก maintainer ตามนโยบายทีม หาก CI แดงให้แก้สาเหตุ ไม่ปิดหรือข้าม check โดยไม่มีเหตุผลและการอนุมัติที่บันทึกไว้ ห้าม merge หรือ deploy production โดยอาศัยความเงียบหรือการอนุมานแทนการอนุมัติ

## Version และ release

- แก้บั๊กที่ backward-compatible: patch; เพิ่มความสามารถที่ backward-compatible: minor; breaking change: major
- เอกสารอย่างเดียวไม่จำเป็นต้อง bump เวอร์ชันผลิตภัณฑ์ เว้นแต่ maintainer กำหนดไว้
- เมื่อ user-facing release ให้เพิ่ม `CHANGELOG.md` ใน PR และให้ version ใน `package.json` กับ `package-lock.json` ตรงกัน
- release/tag ต้องชี้ไปยัง commit ที่ merge แล้วและตรวจสอบได้
- GitHub Pages เผยแพร่จาก `main` ที่ `/`; URL ปัจจุบันคือ <https://aodxx.github.io/video-player-v2-/> (ชื่อ repository มีขีด `-` ปิดท้าย)
- หลัง merge ให้ตรวจ CI, Pages build, HTTP status และเนื้อหาที่เปลี่ยน ส่วน Worker smoke tests ทำเฉพาะเมื่อ Worker ถูกแก้
