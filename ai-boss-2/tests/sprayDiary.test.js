import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSprayRecord } from '../src/sprayDiary.js';

describe('AgriSpray Feature Slice: Tạo nhật ký phun & tính cách ly', () => {
  const validContext = {
    currentUser: { id: 'user-01', name: 'Nông dân Nguyễn Văn A' },
    currentDate: '2026-10-26',
    existingRecords: []
  };

  const validPayload = {
    plot_id: 'PLOT-01',
    pesticide_id: 'PEST-ANVIL-5SC',
    spray_date: '2026-10-26',
    dosage_ml_per_ha: 1200,
    phi_days: 14,
    expected_harvest_date: '2026-11-15'
  };

  describe('Business Rules (Quy tắc tính toán)', () => {
    it('BR-01: Tính chính xác ngày thu hoạch an toàn (spray_date + phi_days)', () => {
      const result = createSprayRecord(validPayload, validContext);
      assert.equal(result.status, 'success');
      // 2026-10-26 + 14 ngày = 2026-11-09
      assert.equal(result.data.safe_harvest_date, '2026-11-09');
      assert.equal(result.data.phi_days, 14);
    });

    it('BR-02: Cho phép thu hoạch khi expected_harvest_date >= safe_harvest_date', () => {
      const result = createSprayRecord(validPayload, validContext);
      assert.equal(result.status, 'success');
      assert.equal(result.data.is_safe_to_harvest, true);
      assert.equal(result.data.days_remaining, 0);
    });

    it('BR-02: Cảnh báo nguy hiểm khi nông dân dự kiến thu hoạch sớm hơn ngày an toàn', () => {
      const payloadEarlyHarvest = {
        ...validPayload,
        expected_harvest_date: '2026-11-05' // Sớm hơn ngày an toàn 2026-11-09 đúng 4 ngày
      };
      const result = createSprayRecord(payloadEarlyHarvest, validContext);
      assert.equal(result.status, 'success');
      assert.equal(result.data.is_safe_to_harvest, false);
      assert.equal(result.data.days_remaining, 4);
    });
  });

  describe('Edge Cases & Mã lỗi nghiệp vụ', () => {
    it('Edge Case: Từ chối khi chưa đăng nhập (AUTH_UNAUTHORIZED - 401)', () => {
      const unauthContext = { ...validContext, currentUser: null };
      const result = createSprayRecord(validPayload, unauthContext);
      assert.equal(result.status, 'error');
      assert.equal(result.http_status, 401);
      assert.equal(result.code, 'AUTH_UNAUTHORIZED');
      assert.equal(result.message, 'Yêu cầu đăng nhập trước khi thao tác');
    });

    it('Edge Case: Thiếu trường bắt buộc (VALIDATION_MISSING_FIELD - 400)', () => {
      const missingPayload = { ...validPayload };
      delete missingPayload.pesticide_id;
      const result = createSprayRecord(missingPayload, validContext);
      assert.equal(result.status, 'error');
      assert.equal(result.http_status, 400);
      assert.equal(result.code, 'VALIDATION_MISSING_FIELD');
    });

    it('Edge Case: Ngày phun ở tương lai (DATE_FUTURE_SPRAY - 400)', () => {
      const futurePayload = {
        ...validPayload,
        spray_date: '2026-10-30' // currentDate là 2026-10-26
      };
      const result = createSprayRecord(futurePayload, validContext);
      assert.equal(result.status, 'error');
      assert.equal(result.http_status, 400);
      assert.equal(result.code, 'DATE_FUTURE_SPRAY');
    });

    it('Edge Case: Liều lượng ngoài phạm vi 10 - 5000 ml/ha (DOSAGE_OUT_OF_RANGE - 422)', () => {
      const underDosage = { ...validPayload, dosage_ml_per_ha: 5 };
      assert.equal(createSprayRecord(underDosage, validContext).code, 'DOSAGE_OUT_OF_RANGE');

      const overDosage = { ...validPayload, dosage_ml_per_ha: 6000 };
      assert.equal(createSprayRecord(overDosage, validContext).code, 'DOSAGE_OUT_OF_RANGE');
    });

    it('Edge Case: Thời gian cách ly PHI ngoài phạm vi 1 - 60 ngày (PHI_OUT_OF_RANGE - 422)', () => {
      const invalidPhi = { ...validPayload, phi_days: 0 };
      assert.equal(createSprayRecord(invalidPhi, validContext).code, 'PHI_OUT_OF_RANGE');

      const overPhi = { ...validPayload, phi_days: 90 };
      assert.equal(createSprayRecord(overPhi, validContext).code, 'PHI_OUT_OF_RANGE');
    });

    it('Edge Case: Trùng lặp cùng plot_id + pesticide_id + spray_date (RECORD_DUPLICATE - 409)', () => {
      const contextWithExisting = {
        ...validContext,
        existingRecords: [
          {
            plot_id: 'PLOT-01',
            pesticide_id: 'PEST-ANVIL-5SC',
            spray_date: '2026-10-26'
          }
        ]
      };
      const result = createSprayRecord(validPayload, contextWithExisting);
      assert.equal(result.status, 'error');
      assert.equal(result.http_status, 409);
      assert.equal(result.code, 'RECORD_DUPLICATE');
    });
  });
});
