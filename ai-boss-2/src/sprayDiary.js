/**
 * Domain Service: AgriSpray - Quản lý nhật ký phun thuốc & Cảnh báo cách ly (PHI)
 * Tuân thủ 100% SPEC.md và AGENTS.md
 */

export const MIN_DOSAGE = 10;
export const MAX_DOSAGE = 5000;
export const MIN_PHI = 1;
export const MAX_PHI = 60;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Cộng thêm số ngày theo chuẩn UTC (YYYY-MM-DD)
 * @param {string} dateStr 
 * @param {number} days 
 * @returns {string} YYYY-MM-DD
 */
function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateUtc = new Date(Date.UTC(year, month - 1, day));
  dateUtc.setUTCDate(dateUtc.getUTCDate() + days);
  return dateUtc.toISOString().slice(0, 10);
}

/**
 * Tính số ngày chênh lệch giữa 2 ngày UTC (tính từ dateA đến dateB)
 * @param {string} dateStrA 
 * @param {string} dateStrB 
 * @returns {number}
 */
function diffDays(dateStrA, dateStrB) {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

/**
 * Tạo bản ghi nhật ký phun thuốc & tính toán ngày thu hoạch an toàn
 * @param {Object} payload 
 * @param {Object} context 
 * @returns {Object} Result Object { status, http_status, code, message, data }
 */
export function createSprayRecord(payload, context = {}) {
  // 1. Kiểm tra xác thực người dùng (Auth Check)
  if (!context.currentUser) {
    return {
      status: 'error',
      http_status: 401,
      code: 'AUTH_UNAUTHORIZED',
      message: 'Yêu cầu đăng nhập trước khi thao tác'
    };
  }

  // 2. Kiểm tra dữ liệu bắt buộc (Validation Check)
  const requiredFields = [
    'plot_id',
    'pesticide_id',
    'spray_date',
    'dosage_ml_per_ha',
    'phi_days',
    'expected_harvest_date'
  ];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return {
        status: 'error',
        http_status: 400,
        code: 'VALIDATION_MISSING_FIELD',
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc'
      };
    }
  }

  // 3. Kiểm tra ngày phun ở tương lai
  const today = context.currentDate || new Date().toISOString().slice(0, 10);
  if (payload.spray_date > today) {
    return {
      status: 'error',
      http_status: 400,
      code: 'DATE_FUTURE_SPRAY',
      message: 'Ngày phun thuốc không được vượt quá ngày hiện tại'
    };
  }

  // 4. Kiểm tra liều lượng (Dosage Range)
  const dosage = Number(payload.dosage_ml_per_ha);
  if (isNaN(dosage) || dosage < MIN_DOSAGE || dosage > MAX_DOSAGE) {
    return {
      status: 'error',
      http_status: 422,
      code: 'DOSAGE_OUT_OF_RANGE',
      message: 'Liều lượng phải từ 10 đến 5000 ml/ha'
    };
  }

  // 5. Kiểm tra thời gian cách ly (PHI Range)
  const phi = Number(payload.phi_days);
  if (isNaN(phi) || !Number.isInteger(phi) || phi < MIN_PHI || phi > MAX_PHI) {
    return {
      status: 'error',
      http_status: 422,
      code: 'PHI_OUT_OF_RANGE',
      message: 'Thời gian cách ly phải từ 1 đến 60 ngày'
    };
  }

  // 6. Kiểm tra trùng lặp lịch phun (Duplicate Check)
  const existingRecords = context.existingRecords || [];
  const isDuplicate = existingRecords.some(
    (item) =>
      item.plot_id === payload.plot_id &&
      item.pesticide_id === payload.pesticide_id &&
      item.spray_date === payload.spray_date
  );

  if (isDuplicate) {
    return {
      status: 'error',
      http_status: 409,
      code: 'RECORD_DUPLICATE',
      message: 'Lô đất này đã được ghi nhận phun thuốc trên vào ngày đã chọn'
    };
  }

  // 7. Thực thi nghiệp vụ tính toán BR-01 & BR-02
  const safe_harvest_date = addDays(payload.spray_date, phi);
  const remainingDays = diffDays(payload.expected_harvest_date, safe_harvest_date);

  const is_safe_to_harvest = remainingDays <= 0;
  const days_remaining = is_safe_to_harvest ? 0 : remainingDays;

  // 8. Trả về kết quả thành công
  return {
    status: 'success',
    data: {
      record_id: `REC-${payload.spray_date.replace(/-/g, '')}-001`,
      plot_id: payload.plot_id,
      spray_date: payload.spray_date,
      safe_harvest_date,
      expected_harvest_date: payload.expected_harvest_date,
      is_safe_to_harvest,
      days_remaining,
      phi_days: phi
    }
  };
}
