<?php
/**
 * VeiNovel Web Installer
 * Untuk hosting yang tidak menyediakan SSH access
 * 
 * Letakkan di public/install.php
 * Akses via: https://yourdomain.com/install.php
 */

// Helper function untuk mengecek jika Laravel sudah terinstall
function isAppInstalled() {
    if (!file_exists('../.env')) {
        return false;
    }
    
    $envContent = file_get_contents('../.env');
    return (strpos($envContent, 'APP_ENV=production') !== false && 
            strpos($envContent, 'APP_KEY=base64:') !== false);
}

// Security check - only run if app is not installed
if (isAppInstalled()) {
    die('Application already installed. Delete this file for security.');
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VeiNovel Installer</title>
    <style>
        body { font-family: Arial; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .step { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 4px; }
        .success { background: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .warning { background: #fff3cd; border-color: #ffeaa7; color: #856404; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], input[type="password"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 VeiNovel Installation</h1>
        
        <?php
        $step = $_GET['step'] ?? 1;
        
        if ($step == 1) {
            // Step 1: Requirements Check
            echo "<div class='step'>";
            echo "<h2>Step 1: System Requirements</h2>";
            
            $requirements = [
                'PHP Version >= 8.1' => version_compare(PHP_VERSION, '8.1.0', '>='),
                'PDO Extension' => extension_loaded('pdo'),
                'PDO MySQL Extension' => extension_loaded('pdo_mysql'),
                'OpenSSL Extension' => extension_loaded('openssl'),
                'Mbstring Extension' => extension_loaded('mbstring'),
                'Tokenizer Extension' => extension_loaded('tokenizer'),
                'Ctype Extension' => extension_loaded('ctype'),
                'JSON Extension' => extension_loaded('json'),
                'BCMath Extension' => extension_loaded('bcmath'),
                'Storage Writable' => is_writable('../storage'),
                'Bootstrap Cache Writable' => is_writable('../bootstrap/cache'),
            ];
            
            $allPassed = true;
            foreach ($requirements as $name => $passed) {
                $class = $passed ? 'success' : 'error';
                echo "<div class='$class'>$name: " . ($passed ? '✅ OK' : '❌ FAILED') . "</div>";
                if (!$passed) $allPassed = false;
            }
            
            if ($allPassed) {
                echo "<a href='?step=2' class='btn'>Next: Database Setup</a>";
            } else {
                echo "<div class='error'><strong>Please fix the requirements above before continuing.</strong></div>";
            }
            echo "</div>";
            
        } elseif ($step == 2) {
            // Step 2: Database Configuration
            echo "<div class='step'>";
            echo "<h2>Step 2: Database Configuration</h2>";
            
            if ($_POST) {
                $dbHost = $_POST['db_host'];
                $dbPort = $_POST['db_port'];
                $dbName = $_POST['db_name'];
                $dbUser = $_POST['db_username'];
                $dbPass = $_POST['db_password'];
                
                // Test database connection
                try {
                    $pdo = new PDO("mysql:host=$dbHost;port=$dbPort;dbname=$dbName", $dbUser, $dbPass);
                    echo "<div class='success'>✅ Database connection successful!</div>";
                    
                    // Create .env file
                    $envContent = "APP_NAME=\"VeiNovel\"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=" . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . "://" . $_SERVER['HTTP_HOST'] . "

DB_CONNECTION=mysql
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_DATABASE=$dbName
DB_USERNAME=$dbUser
DB_PASSWORD=$dbPass

SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

CACHE_STORE=database
QUEUE_CONNECTION=database

LOG_CHANNEL=stack
LOG_LEVEL=error

MAIL_MAILER=log
";
                    
                    file_put_contents('../.env', $envContent);
                    echo "<div class='success'>✅ .env file created!</div>";
                    echo "<a href='?step=3' class='btn'>Next: Install Application</a>";
                    
                } catch (Exception $e) {
                    echo "<div class='error'>❌ Database connection failed: " . $e->getMessage() . "</div>";
                }
            }
            ?>
            
            <form method="POST">
                <div class="form-group">
                    <label>Database Host:</label>
                    <input type="text" name="db_host" value="localhost" required>
                </div>
                <div class="form-group">
                    <label>Database Port:</label>
                    <input type="text" name="db_port" value="3306" required>
                </div>
                <div class="form-group">
                    <label>Database Name:</label>
                    <input type="text" name="db_name" required>
                    <small>Create this database first via cPanel</small>
                </div>
                <div class="form-group">
                    <label>Database Username:</label>
                    <input type="text" name="db_username" required>
                </div>
                <div class="form-group">
                    <label>Database Password:</label>
                    <input type="password" name="db_password" required>
                </div>
                <button type="submit" class="btn">Test & Save Database Config</button>
            </form>
            
            <?php
            echo "</div>";
            
        } elseif ($step == 3) {
            // Step 3: Application Installation
            echo "<div class='step'>";
            echo "<h2>Step 3: Application Installation</h2>";
            
            chdir('..');
            
            echo "<h3>Running Installation Commands:</h3>";
            
            // Check if shell_exec is available
            $canRunCommands = function_exists('shell_exec') && !in_array('shell_exec', explode(',', ini_get('disable_functions')));
            
            if (!$canRunCommands) {
                echo "<div class='warning'>";
                echo "<h3>⚠️ Manual Commands Required</h3>";
                echo "<p>Your hosting doesn't allow shell commands. Please run these manually via cPanel Terminal or contact support:</p>";
                echo "<div class='code'>";
                echo "php artisan key:generate<br>";
                echo "php artisan migrate --force<br>";
                echo "php artisan db:seed --force<br>";
                echo "php artisan storage:link<br>";
                echo "php artisan config:cache<br>";
                echo "</div>";
                echo "<p>After running these commands, <a href='?step=4'>click here to continue</a></p>";
                echo "</div>";
                echo "</div>";
                return;
            }
            
            // Generate App Key
            echo "<div class='code'>";
            echo "Generating application key...<br>";
            $output = shell_exec('php artisan key:generate --force 2>&1');
            echo htmlspecialchars($output);
            echo "</div>";
            
            // Run Migrations
            echo "<div class='code'>";
            echo "Running database migrations...<br>";
            $output = shell_exec('php artisan migrate --force 2>&1');
            echo htmlspecialchars($output);
            echo "</div>";
            
            // Seed Database
            echo "<div class='code'>";
            echo "Seeding database with initial data...<br>";
            $output = shell_exec('php artisan db:seed --force 2>&1');
            echo htmlspecialchars($output);
            echo "</div>";
            
            // Create Storage Link
            echo "<div class='code'>";
            echo "Creating storage symlink...<br>";
            $output = shell_exec('php artisan storage:link 2>&1');
            echo htmlspecialchars($output);
            echo "</div>";
            
            // Cache Config
            echo "<div class='code'>";
            echo "Caching configuration...<br>";
            $output = shell_exec('php artisan config:cache 2>&1');
            echo htmlspecialchars($output);
            echo "</div>";
            
            echo "<div class='success'>✅ Installation completed!</div>";
            echo "<a href='?step=4' class='btn'>Final Step: Admin Setup</a>";
            echo "</div>";
            
        } elseif ($step == 4) {
            // Step 4: Final Setup & Admin Info
            echo "<div class='step'>";
            echo "<h2>🎉 Installation Complete!</h2>";
            
            echo "<div class='success'>";
            echo "<h3>Your VeiNovel application is ready!</h3>";
            echo "<p><strong>Website:</strong> <a href='/' target='_blank'>" . $_SERVER['HTTP_HOST'] . "</a></p>";
            echo "<p><strong>Admin Panel:</strong> <a href='/admin' target='_blank'>" . $_SERVER['HTTP_HOST'] . "/admin</a></p>";
            echo "</div>";
            
            echo "<div class='warning'>";
            echo "<h3>Default Admin Account:</h3>";
            echo "<p><strong>Email:</strong> admin@fantl.com</p>";
            echo "<p><strong>Password:</strong> Check your DatabaseSeeder.php file</p>";
            echo "<p><em>Please change the admin password immediately after login!</em></p>";
            echo "</div>";
            
            echo "<div class='warning'>";
            echo "<h3>Security Notice:</h3>";
            echo "<p>🔒 <strong>DELETE THIS INSTALLER FILE</strong> for security!</p>";
            echo "<p>Remove: <code>public/install.php</code></p>";
            echo "</div>";
            
            echo "<div class='step'>";
            echo "<h3>Next Steps:</h3>";
            echo "<ul>";
            echo "<li>✅ Delete this installer file</li>";
            echo "<li>✅ Login as admin and change password</li>";
            echo "<li>✅ Configure PayPal settings in admin panel</li>";
            echo "<li>✅ Add your first series and chapters</li>";
            echo "<li>✅ Test payment system</li>";
            echo "<li>✅ Setup email settings if needed</li>";
            echo "</ul>";
            echo "</div>";
            
            echo "<a href='/' class='btn'>Go to Website</a> ";
            echo "<a href='/admin' class='btn'>Go to Admin Panel</a>";
            echo "</div>";
        }
        ?>
        
    </div>
</body>
</html>
