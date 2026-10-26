# REVIEW NOTES: AGRISPRAY FEATURE SLICE

## 1. Kết quả Review theo Checklist

### ✅ Correctness (Tính đúng đắn)
- **Công thức ngày cách ly:** Phép cộng `safe_harvest_date = spray_date + phi_days` được xử lý hoàn toàn theo chuẩn UTC (`Date.UTC`), loại bỏ triệt để lỗi lệch múi giờ (Timezone Drift).
- **Logic an toàn:** Cờ `is_safe_to_harvest` và số ngày chờ `days_remaining` tính toán chính xác khi ngày thu hoạch sớm hơn, bằng hoặc muộn hơn ngày an toàn.
- **Biên giá trị:** Kiểm tra chặt chẽ các giá trị biên `dosage_ml_per_ha` (10 đến 5000) và `phi_days` (1 đến 60 ngày).

### ✅ Security (Tính an toàn & Bảo mật)
- **Kiểm soát truy cập (Authentication):** Kiểm tra `currentUser` ngay đầu hàm, trả về mã lỗi chuẩn `401 Unauthorized` nếu chưa đăng nhập.
- **Không đột biến dữ liệu (Immutability):** Object đầu vào không bị mutate, đảm bảo tính bất biến (Pure function).
- **Không có dữ liệu thật (Zero Real Data):** Toàn bộ dữ liệu kiểm thử đều dùng mock `PLOT-01`, `PEST-ANVIL-5SC`, tuân thủ Privacy Mode.

### ✅ Consistency (Tính nhất quán)
- **Cấu trúc JSON:** Tất cả phản hồi đều tuân theo format chuẩn:
  - Thành công: `{ status: 'success', data: { ... } }`
  - Thất bại: `{ status: 'error', http_status: ..., code: '...', message: '...' }`
- **Mã lỗi:** Đặt tên dạng `SCREAMING_SNAKE_CASE` có tiền tố rõ ràng (`AUTH_*`, `VALIDATION_*`, `DOSAGE_*`, `RECORD_*`).

---

## 2. Hai lỗi / thiếu sót của AI bắt được & Cách sửa qua Spec

### Lỗi 1: AI dùng Date Local làm lệch ngày theo múi giờ máy tính
- **Hiện tượng:** AI sinh mã ban đầu dùng `new Date(spray_date)` và `date.setDate(date.getDate() + days)`. Khi chạy kiểm thử trên máy ở múi giờ GMT+7 vào đầu ngày hoặc cuối ngày, ngày an toàn bị nhảy lùi 1 ngày thành `2026-11-08` thay vì `2026-11-09`.
- **Cách sửa qua Spec:** Bổ sung vào **BR-01**: *"Định dạng ngày bắt buộc YYYY-MM-DD. Mọi phép cộng trừ ngày phải thực hiện trên trục thời gian UTC (Date.UTC)"*.

### Lỗi 2: AI bỏ sót kiểm tra số nguyên của thời gian cách ly (PHI)
- **Hiện tượng:** Khi truyền `phi_days: 14.5`, code AI vẫn cho qua và sinh ra ngày thu hoạch có giờ lẻ, vi phạm quy chuẩn nông nghiệp (thời gian cách ly thuốc BVTV luôn tính theo ngày nguyên vẹn).
- **Cách sửa qua Spec:** Cập nhật mục **Edge Cases**: *"phi_days phải là số nguyên dương: Number.isInteger(phi_days) và từ 1 đến 60 ngày, vi phạm trả về mã PHI_OUT_OF_RANGE (HTTP 422)"*.

---

## 3. Phản hồi từ Reviewer (Tìm 3 chỗ mơ hồ & Đã sửa Spec)

| # | Chỗ thiếu / Mơ hồ ban đầu | Phản hồi của Reviewer | Cách đã cập nhật vào SPEC.md |
| :- | :--- | :--- | :--- |
| **1** | Chỉ ghi "liều lượng hợp lệ" chung chung, không có số liệu cụ thể. | Cần con số min/max rõ ràng theo khuyến cáo Bộ Nông nghiệp để tránh ngộ độc cây hoặc không đủ liều. | Thêm quy tắc **BR-03**: `10 <= dosage_ml_per_ha <= 5000` ml/ha, kèm mã lỗi `DOSAGE_OUT_OF_RANGE`. |
| **2** | Chưa chặn việc nông dân ghi nhật ký cho tương lai. | Không thể phun thuốc vào "ngày mai" rồi ghi nhật ký hôm nay. | Thêm Edge Case **DATE_FUTURE_SPRAY (400)**: `spray_date <= current_date`. |
| **3** | Phần giao diện chưa mô tả cụ thể Empty State. | Trạng thái rỗng không có chữ hiển thị sẽ khiến dev frontend tự chế giao diện sai lệch. | Bổ sung mục **2.2 (Empty State)** với câu thông điệp chính xác và nút bấm hành động gợi ý. |

---

## 4. Tổng kết 5 dòng: Tuần AI này thay đổi cách làm việc với AI

1. Tôi nhận ra AI chỉ thực sự thông minh khi được dẫn dắt bởi một bản Spec chặt chẽ không có câu từ mơ hồ.
2. Viết Test trước (TDD) là chiếc phanh an toàn giúp tôi kiểm soát hoàn toàn việc AI sinh code đúng hay sai.
3. Thay vì sửa code AI bằng tay nhiều lần, tôi học được cách tinh chỉnh Spec để AI tự sửa lại đúng hướng.
4. Vai trò của lập trình viên đã dịch chuyển từ người gõ phím cơ học sang kiến trúc sư nghiệm thu chất lượng.
5. Kỷ luật về Spec và Checklist giúp tốc độ phát triển tăng gấp ba lần mà không hề hy sinh tính bảo mật.
