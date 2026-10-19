-- =======================================================================
-- CÂU 3: SQL - THIẾT KẾ BẢNG NỘP BÀI VÀ VIẾT TRUY VẤN BÁO CÁO (20 ĐIỂM)
-- Hệ thống có sẵn: students(id, name) và assignments(id, title)
-- =======================================================================

-- -----------------------------------------------------------------------
-- 1. Lệnh CREATE TABLE submissions (MySQL)
-- Yêu cầu:
--   - Khoá chính: id (AUTO_INCREMENT)
--   - Hai khoá ngoại: student_id -> students(id), assignment_id -> assignments(id)
--   - Ràng buộc không cho một học viên nộp trùng cùng một bài: UNIQUE(student_id, assignment_id)
--   - Cột score: Thang điểm 10, một chữ số thập phân, cho phép NULL: DECIMAL(3, 1) NULL
--   - Cột thời gian nộp: submitted_at có giá trị mặc định CURRENT_TIMESTAMP
-- -----------------------------------------------------------------------
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    assignment_id INT NOT NULL,
    score DECIMAL(3, 1) NULL DEFAULT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submissions_students FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_assignments FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT uq_student_assignment UNIQUE (student_id, assignment_id)
);


-- -----------------------------------------------------------------------
-- 2. Truy vấn liệt kê học viên có điểm trung bình từ 8 trở lên,
--    kèm số bài đã nộp, sắp xếp điểm trung bình giảm dần (JOIN, GROUP BY, HAVING)
-- -----------------------------------------------------------------------
SELECT 
    s.id,
    s.name,
    COUNT(sub.id) AS total_submissions,
    AVG(sub.score) AS avg_score
FROM students s
JOIN submissions sub ON s.id = sub.student_id
GROUP BY s.id, s.name
HAVING AVG(sub.score) >= 8
ORDER BY avg_score DESC;


-- -----------------------------------------------------------------------
-- 3. Truy vấn liệt kê học viên chưa nộp bài tập có id = 3
--    (kể cả học viên chưa nộp bài nào)
-- -----------------------------------------------------------------------
-- Cách 1: Dùng LEFT JOIN kết hợp điều kiện assignment_id = 3 và kiểm tra NULL
SELECT 
    s.id, 
    s.name
FROM students s
LEFT JOIN submissions sub ON s.id = sub.student_id AND sub.assignment_id = 3
WHERE sub.id IS NULL;

-- (Cách 2 tham khảo: Dùng NOT EXISTS)
-- SELECT s.id, s.name
-- FROM students s
-- WHERE NOT EXISTS (
--     SELECT 1 FROM submissions sub
--     WHERE sub.student_id = s.id AND sub.assignment_id = 3
-- );
