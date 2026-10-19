<?php
// =======================================================================
// CÂU 3 - Ý 4: Đoạn PHP PDO dùng prepared statement chạy lại truy vấn ở ý 2
// với ngưỡng điểm do người dùng truyền vào (biến $min)
// =======================================================================

/**
 * Giả sử biến $pdo đã được khởi tạo trước đó:
 * $pdo = new PDO("mysql:host=localhost;dbname=ten_csdl;charset=utf8mb4", "root", "", [
 *     PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
 * ]);
 */

// Ngưỡng điểm do người dùng truyền vào (ví dụ $min = 8.0)
$min = 8.0;

// Câu truy vấn chuẩn bị với placeholder đặt tên (:min_score) hoặc (?)
$sql = "SELECT 
            s.id,
            s.name,
            COUNT(sub.id) AS total_submissions,
            AVG(sub.score) AS avg_score
        FROM students s
        JOIN submissions sub ON s.id = sub.student_id
        GROUP BY s.id, s.name
        HAVING AVG(sub.score) >= :min_score
        ORDER BY avg_score DESC";

// 1. Chuẩn bị câu lệnh (prepare)
$stmt = $pdo->prepare($sql);

// 2. Gán tham số và thực thi (execute)
$stmt->execute([
    ':min_score' => $min
]);

// 3. Lấy tất cả kết quả dưới dạng mảng kết hợp (Associative Array)
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 4. Duyệt và hiển thị kết quả (nếu cần hiển thị)
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Danh sách học viên có điểm trung bình >= <?= htmlspecialchars($min, ENT_QUOTES, 'UTF-8') ?></title>
</head>
<body>
    <h2>Danh sách học viên đạt ĐTB >= <?= htmlspecialchars($min, ENT_QUOTES, 'UTF-8') ?></h2>

    <table border="1" cellpadding="8" cellspacing="0">
        <thead>
            <tr>
                <th>Mã học viên</th>
                <th>Họ tên</th>
                <th>Số bài đã nộp</th>
                <th>Điểm trung bình</th>
            </tr>
        </thead>
        <tbody>
            <?php if (!empty($results)): ?>
                <?php foreach ($results as $row): ?>
                    <tr>
                        <td><?= htmlspecialchars($row['id'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars($row['name'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars($row['total_submissions'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars(number_format($row['avg_score'], 1), ENT_QUOTES, 'UTF-8') ?></td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td colspan="4" align="center">Không có học viên nào đạt ngưỡng điểm này.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html>
