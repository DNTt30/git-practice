<?php
// session_star() bắt đầu phiên làm việc
session_start();

// Giả định biến $pdo (PDO, ERRMODE_EXCEPTION) và bảng users(id, email, password_hash) đã có sẵn.
// Nếu file được require hoặc nhúng kết nối CSDL từ ngoài thì bỏ qua khối này.
if (!isset($pdo)) {
    // Đoạn mẫu kết nối nếu chạy độc lập (tùy chỉnh lại nếu cần)
    // $pdo = new PDO("mysql:host=localhost;dbname=test_db;charset=utf8mb4", "root", "", [
    //     PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    // ]);
}

// 1. Sinh CSRF token và lưu sẵn trong session khi hiện form
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Xử lý khi request là POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Kiểm tra CSRF token
    $csrf = $_POST['csrf'] ?? '';
    if (empty($csrf) || !hash_equals($_SESSION['csrf_token'], $csrf)) {
        $_SESSION['flash'] = 'CSRF token không hợp lệ!';
        header('Location: /login.php');
        exit;
    }

    // 2. Kiểm tra email hợp lệ và mật khẩu không rỗng
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        $_SESSION['flash'] = 'Email hoặc mật khẩu không hợp lệ!';
        header('Location: /login.php');
        exit;
    }

    // 3. Tìm user theo email và xác thực mật khẩu đã băm
    $stmt = $pdo->prepare("SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Xác thực mật khẩu
    if ($user && password_verify($password, $user['password_hash'])) {
        // 4. Đăng nhập đúng:
        // Chống chiếm phiên (session fixation)
        session_regenerate_id(true);

        // Lưu user_id vào session
        $_SESSION['user_id'] = $user['id'];

        // Đặt flash message rồi chuyển hướng sang /dashboard.php
        $_SESSION['flash'] = 'Đăng nhập thành công!';
        header('Location: /dashboard.php');
        exit;
    } else {
        // Đăng nhập sai: flash 'Email hoặc mật khẩu không đúng' và quay lại /login.php
        $_SESSION['flash'] = 'Email hoặc mật khẩu không đúng';
        header('Location: /login.php');
        exit;
    }
}

// 5. Lấy flash message và xóa ngay sau đó (hiển thị đúng 1 lần)
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Đăng nhập</title>
</head>
<body>
    <h2>Đăng nhập</h2>

    <!-- 5. Phần HTML hiển thị flash message một lần, in ra an toàn -->
    <?php if ($flash !== null): ?>
        <p style="color: red;"><?= htmlspecialchars($flash, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <!-- Form đăng nhập gồm email, password và trường ẩn csrf -->
    <form action="/login.php" method="POST">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
        <div>
            <label for="email">Email:</label>
            <input type="text" id="email" name="email" value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>" required>
        </div>
        <div>
            <label for="password">Mật khẩu:</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">Đăng nhập</button>
    </form>
</body>
</html>
