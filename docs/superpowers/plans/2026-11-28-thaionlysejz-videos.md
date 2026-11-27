# ThaiOnlySejz Video Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution with red/green test checkpoints.

**Goal:** เพิ่มวิดีโอสาธารณะที่ตรวจสอบแล้วจาก @ThaiOnlySejz ลงในแค็ตตาล็อก player โดยไม่ซ้ำกับรายการเดิม

**Architecture:** ใช้ schema แถวเดิมใน `data/videos.txt` และเพิ่ม source code ใหม่ใน `src/catalog.js` โดยไม่เปลี่ยน parser, UI runtime หรือ Worker. ใช้ข้อมูลจาก Apify dataset เป็น provenance; เลือก MP4 rendition ที่ bitrate สูงสุด, เก็บ post URL, thumbnail, duration, view count และข้อความที่มีอยู่ แล้วตัด duplicate ตาม VIDEO_URL.

**Tech Stack:** Static JavaScript ES modules, Node.js test runner, text catalogue, Apify dataset.

**Spec:** คำขอผู้ใช้ให้เพิ่มวิดีโอทั้งหมดที่พบจาก https://x.com/ThaiOnlySejz; อนุมัติ Apify สูงสุด 20,000 items / USD 3.00.

## Global Constraints

- ห้ามทำงานหรือ commit ตรงบน `main`; ใช้ feature branch และเปิด PR เฉพาะเมื่อทำ remote operations ได้.
- รักษา schema ของ `data/videos.txt` และไม่แก้ Worker/CORS/proxy.
- เพิ่ม source ต้องมี catalog regression test; ตรวจ URLs/metadata และ duplicate ด้วย VIDEO_URL.
- `npm run check` ต้องผ่านก่อนส่ง PR; maintainer review/merge/deploy เป็นขั้นตอนแยก.
- Apify dataset รายงาน 609 items; 505 unique MP4 URLs, 428 already represented, 77 candidate new unique URLs.

---

### Task 1: Test-first source registration

**Files:**
- Modify: `tests/catalog.test.js`
- Modify: `src/catalog.js`

**Interfaces:**
- Existing `parseRawData(raw)` returns validated records from the pipe-delimited catalogue.
- New source code `TS` maps to source name `ThaiOnlySejz` and label `@ThaiOnlySejz`.

- [x] เพิ่ม test ให้แถว TS ที่มี metadata ถูกต้อง parse เป็น ThaiOnlySejz.
- [x] รัน test เฉพาะชุด ยืนยันว่า fail เพราะ source code ยังไม่รู้จัก.
- [x] เพิ่ม TS ใน `SOURCES` และ `ACCOUNT_LABELS`.
- [x] รัน test เฉพาะชุด ยืนยัน GREEN.

### Task 2: Import verified unique videos

**Files:**
- Modify: `data/videos.txt`
- Modify: `CHANGELOG.md`

**Interfaces:**
- แต่ละแถวมี 8 fields: `SOURCE|POSTED_AT|POST_URL|VIDEO_URL|THUMBNAIL_URL|DURATION_SECONDS|VIEWS|TEXT`.
- ข้อมูลมาจาก Apify dataset `bLTanOp7VyFjO4FZC`, run `SHCpSdUgvdRFMiID3`.

- [x] เขียนเฉพาะ 77 URL ใหม่ที่ unique ภายใน dataset และไม่พบใน catalogue; ใช้ MP4 ที่ bitrate สูงสุดต่อ media object.
- [x] ตรวจ timestamp เป็น UTC ตามค่า source, URL hosts, metadata และ duplicate.
- [x] บันทึกสรุป data provenance/จำนวนใน Unreleased changelog.

### Task 3: Validate and prepare local handoff

**Files:**
- Verify: changed files and repository checks.
- Prepare: local Git commit and patch file for handoff.

- [x] รัน `npm run check`.
- [x] ตรวจ `git diff --check`, duplicate VIDEO_URL, secret scan, และ diff scope.
- [x] Commit atomic change(s) บน feature branch และสร้าง patch file.
- [x] ไม่ merge หรือ deploy; ระบุว่า push/PR ยังไม่ได้ทำ.
