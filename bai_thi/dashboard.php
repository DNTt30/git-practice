<?php
session_start();

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    $_SESSION['flash'] = 'Vui lòng đăng nhập trước!';
    header('Location: /login.php');
    exit;
}

$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Dashboard</title>
</head>
<body>
    <?php if ($flash !== null): ?>
        <p style="color: green;"><?= htmlspecialchars($flash, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <h2>Xin chào, User #<?= htmlspecialchars($_SESSION['user_id'], ENT_QUOTES, 'UTF-8') ?>!</h2>
    <p>Bạn đã đăng nhập an toàn thành công.</p>
    <a href="/login.php">Quay lại trang login</a>
</body>
</html>
