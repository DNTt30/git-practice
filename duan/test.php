<?php
    session_start();
    $_SESSION['csrf_token'] = $_SESSION['csrf_token']= ?? random_int(100000, 999999);
    if ($_SESSION['REQUEST_METHOD'] == 'POST'){
        if ($_POST['csrf'] != $_SESSION['csrf_token']){
            http_response_code(419);
            exit('CSRF ko hop le');
        }
        
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        
        if ( $email == '' || $password == ''){
            exit ('nhap tk va mk');
        }


        // da co san pdo
        $stmt = $pdo->prepare('SELECT id,email, password FROM users WHERE email = :email');
        $stmt->excute(['email'] => $email);
        $user = $stmt->fetch();
        
        // viet tiep
        
    }

?>