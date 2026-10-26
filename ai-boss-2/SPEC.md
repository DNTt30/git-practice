# SPECIFICATION: NHẬT KÝ PHUN THUỐC VÀ TÍNH THỜI GIAN CÁCH LY (AGRISPRAY)

## 1. Business Rules (Quy tắc nghiệp vụ)

- **BR-01 (Tính ngày thu hoạch an toàn - Safe Harvest Date):**
  - Công thức: `safe_harvest_date = spray_date + phi_days` (Pre-Harvest Interval - thời gian cách ly theo ngày).
  - Định dạng ngày bắt buộc: `YYYY-MM-DD`. Phép cộng theo ngày dương lịch (UTC).
- **BR-02 (Kiểm tra cảnh báo thu hoạch sớm - Harvest Warning):**
  - Nếu nông dân dự kiến thu hoạch (`expected_harvest_date`) trước ngày `safe_harvest_date`, hệ thống kích hoạt cờ cảnh báo:
    - `is_safe_to_harvest = false`
    - `days_remaining = safe_harvest_date - expected_harvest_date` (số ngày còn phải chờ).
  - Nếu `expected_harvest_date >= safe_harvest_date`:
    - `is_safe_to_harvest = true`
    - `days_remaining = 0`.
- **BR-03 (Quy chuẩn liều lượng phun - Dosage Rule):**
  - Liều lượng (`dosage_ml_per_ha`) phải là số dương: `10 <= dosage_ml_per_ha <= 5000` (ml/ha).
  - Vượt quá 5000 ml/ha coi là dư lượng độc hại, nhỏ hơn 10 ml/ha là không hiệu quả.
- **BR-04 (Quy chuẩn thời gian cách ly - PHI):**
  - `phi_days` là số nguyên dương: `1 <= phi_days <= 60` ngày.
- **BR-05 (Chống trùng lặp lịch phun cùng lô):**
  - Không cho phép ghi nhận 2 lần phun cùng một loại thuốc (`pesticide_id`) trên cùng một lô đất (`plot_id`) trong cùng một ngày (`spray_date`).

---

## 2. API & Giao diện (Interface & States)

### 2.1. API Specification
- **Endpoint:** `POST /api/v1/spray-records`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Payload:**
```json
{
  "plot_id": "PLOT-01",
  "pesticide_id": "PEST-ANVIL-5SC",
  "spray_date": "2026-10-26",
  "dosage_ml_per_ha": 1200,
  "phi_days": 14,
  "expected_harvest_date": "2026-11-15"
}
```

### 2.2. Bốn trạng thái bắt buộc (4 States)
1. **Loading State:**
   - Hiển thị spinner/skeleton tải dữ liệu, vô hiệu hóa nút "Lưu nhật ký" (`disabled = true`, label: `"Đang lưu nhật ký & tính ngày cách ly..."`).
2. **Empty State:**
   - Khi chưa có lần phun thuốc nào trong mùa vụ của lô: Hiển thị minh họa mảnh vườn xanh + text: `"Chưa có nhật ký phun thuốc nào cho lô đất này. Bấm 'Ghi nhận phun' để bắt đầu theo dõi cách ly an toàn."`.
3. **Error State:**
   - Trả về mã lỗi HTTP tương ứng kèm cấu trúc JSON:
   ```json
   {
     "status": "error",
     "code": "<ERROR_CODE>",
     "message": "<Mô tả lỗi tiếng Việt cụ thể>"
   }
   ```
4. **Success State:**
   - HTTP 201 Created kèm dữ liệu tính toán:
   ```json
   {
     "status": "success",
     "data": {
       "record_id": "REC-20261026-001",
       "plot_id": "PLOT-01",
       "spray_date": "2026-10-26",
       "safe_harvest_date": "2026-11-09",
       "expected_harvest_date": "2026-11-15",
       "is_safe_to_harvest": true,
       "days_remaining": 0,
       "phi_days": 14
     }
   }
   ```

---

## 3. Edge Cases & Error Codes

Mọi trường hợp ngoại lệ đều có mã lỗi và status code cụ thể:

| Trường hợp (Edge Case) | Điều kiện kích hoạt | HTTP Code | Error Code | Message |
| :--- | :--- | :--- | :--- | :--- |
| **Chưa đăng nhập** | Thiếu Bearer Token hoặc token không hợp lệ | `401 Unauthorized` | `AUTH_UNAUTHORIZED` | "Yêu cầu đăng nhập trước khi thao tác" |
| **Dữ liệu rỗng / thiếu trường** | Thiếu bất kỳ trường bắt buộc nào (`plot_id`, `pesticide_id`, `spray_date`, `dosage_ml_per_ha`, `phi_days`, `expected_harvest_date`) | `400 Bad Request` | `VALIDATION_MISSING_FIELD` | "Vui lòng điền đầy đủ các thông tin bắt buộc" |
| **Ngày phun tương lai** | `spray_date > current_date` | `400 Bad Request` | `DATE_FUTURE_SPRAY` | "Ngày phun thuốc không được vượt quá ngày hiện tại" |
| **Liều lượng vượt ngưỡng** | `dosage_ml_per_ha < 10` hoặc `dosage_ml_per_ha > 5000` | `422 Unprocessable` | `DOSAGE_OUT_OF_RANGE` | "Liều lượng phải từ 10 đến 5000 ml/ha" |
| **Số ngày cách ly bất hợp lệ**| `phi_days < 1` hoặc `phi_days > 60` hoặc không nguyên | `422 Unprocessable` | `PHI_OUT_OF_RANGE` | "Thời gian cách ly phải từ 1 đến 60 ngày" |
| **Trùng lặp lịch phun** | Trùng `(plot_id, pesticide_id, spray_date)` trong DB | `409 Conflict` | `RECORD_DUPLICATE` | "Lô đất này đã được ghi nhận phun thuốc trên vào ngày đã chọn" |

---

## 4. Out of Scope (Ngoài phạm vi lát cắt)

- Quản lý tồn kho thuốc bảo vệ thực vật trong kho vật tư.
- Kết nối cảm biến thời tiết (nhiệt độ, gió, độ ẩm) khi phun.
- Tích hợp cổng thanh toán mua bán nông sản.
- Xuất chứng chỉ VietGAP dạng PDF có chữ ký số.
- Phân quyền nhiều cấp (Chủ nhiệm HTX, kỹ sư nông nghiệp, xã viên).
