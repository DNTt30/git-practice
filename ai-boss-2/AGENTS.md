# HƯỚNG DẪN AGENT (AGENTS.MD)

## 1. Stack kỹ thuật
- **Ngôn ngữ:** JavaScript (Node.js v20+ / v24+ Native ESM).
- **Test Runner:** `node:test` và `node:assert/strict` (chuẩn Node.js built-in, không cần cài npm phụ trợ).
- **Kiến trúc:** Functional Domain Service (Pure functions, Deterministic, Zero side-effects).

## 2. Quy ước phát triển (Conventions)
- **Chuẩn ngày tháng:** Định dạng ISO-8601 (`YYYY-MM-DD`). Mọi phép cộng ngày dùng chuẩn UTC `Date.UTC`.
- **Validation-First:** Mọi hàm nghiệp vụ kiểm tra tính hợp lệ dữ liệu trước khi xử lý logic.
- **Pure Function:** Hàm `createSprayRecord(input, context)` nhận dữ liệu và context (session, repo giả lập), trả về Result Object `{ success, data, error }`.
- **Mã lỗi chuẩn:** Tuân thủ 100% mã lỗi và HTTP status quy định trong [SPEC.md](file:///d:/git-practice/ai-boss-2/SPEC.md).

## 3. Điều KHÔNG làm (Strictly Prohibited)
- ❌ KHÔNG cài đặt thêm thư viện ngoài (moment, lodash, date-fns, express,...).
- ❌ KHÔNG hardcode số ma thuật (magic numbers); phải dùng hằng số `MIN_DOSAGE = 10`, `MAX_DOSAGE = 5000`, `MIN_PHI = 1`, `MAX_PHI = 60`.
- ❌ KHÔNG biến đổi (mutate) object đầu vào.
- ❌ KHÔNG bỏ qua bất kỳ edge case nào đã được định nghĩa trong `SPEC.md`.
- ❌ KHÔNG thêm tính năng ngoài phạm vi (Out of Scope).
