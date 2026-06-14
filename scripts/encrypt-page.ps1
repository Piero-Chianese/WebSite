Param(
    [string]$Password
)

if (-not $Password) {
    $Password = Read-Host "Enter encryption password for the page"
}

if (-not $Password) {
    Write-Error "Error: Password cannot be empty."
    exit 1
}

$rawPath = Join-Path $PSScriptRoot "..\project-still-hear.raw.html"
$outPath = Join-Path $PSScriptRoot "..\project-still-hear.html"

if (-not (Test-Path $rawPath)) {
    Write-Error "Error: Source file not found at $rawPath"
    exit 1
}

try {
    Write-Host "Reading $rawPath..."
    $plaintext = [System.IO.File]::ReadAllText($rawPath, [System.Text.Encoding]::UTF8)
    $plainBytes = [System.Text.Encoding]::UTF8.GetBytes($plaintext)

    # 1. Generate 16-byte random Salt
    $salt = New-Object Byte[] 16
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($salt)

    # 2. Derive 256-bit Key using PBKDF2 (SHA-256)
    $pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($Password, $salt, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
    $key = $pbkdf2.GetBytes(32)

    # 3. Generate 16-byte random IV for CBC
    $iv = New-Object Byte[] 16
    $rng.GetBytes($iv)

    # 4. Encrypt using AES-CBC with PKCS7 padding
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = $key
    $aes.IV = $iv

    $encryptor = $aes.CreateEncryptor()
    $ms = New-Object System.IO.MemoryStream
    $cs = New-Object System.Security.Cryptography.CryptoStream($ms, $encryptor, [System.Security.Cryptography.CryptoStreamMode]::Write)
    $cs.Write($plainBytes, 0, $plainBytes.Length)
    $cs.FlushFinalBlock()
    $encryptedBytes = $ms.ToArray()

    $cs.Close()
    $ms.Close()
    $aes.Clear()

    # 5. Convert to format for Web Crypto
    $ciphertextBase64 = [Convert]::ToBase64String($encryptedBytes)
    $saltHex = [System.BitConverter]::ToString($salt).Replace("-", "").ToLower()
    $ivHex = [System.BitConverter]::ToString($iv).Replace("-", "").ToLower()

    # 6. Generate Decryption Template
    $template = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Still Hear | Private Project</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #0b0f19;
            color: #f3f4f6;
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 1rem;
            position: relative;
            overflow: hidden;
        }

        body::before, body::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            filter: blur(120px);
            z-index: 0;
            opacity: 0.15;
            pointer-events: none;
        }
        body::before {
            background: #3b82f6;
            top: 10%;
            left: 10%;
        }
        body::after {
            background: #da5b82;
            bottom: 10%;
            right: 10%;
        }

        .login-card {
            background: rgba(17, 25, 40, 0.65);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 3rem 2.5rem;
            width: 100%;
            max-width: 420px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            z-index: 10;
            transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .login-card:hover {
            border-color: rgba(59, 130, 246, 0.3);
        }
        .login-card h2 {
            margin-top: 0;
            font-size: 2.25rem;
            color: #fff;
            margin-bottom: 0.75rem;
            letter-spacing: -0.025em;
            background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .login-card p {
            color: #9ca3af;
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 2.5rem;
        }
        .input-group {
            margin-bottom: 1.75rem;
            text-align: left;
        }
        .input-group label {
            display: block;
            font-size: 0.85rem;
            font-weight: 500;
            color: #9ca3af;
            margin-bottom: 0.6rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .input-wrapper {
            position: relative;
        }
        .input-group input {
            width: 100%;
            padding: 0.9rem 1.2rem;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.03);
            color: #fff;
            font-size: 1.05rem;
            box-sizing: border-box;
            outline: none;
            transition: all 0.3s ease;
            font-family: inherit;
        }
        .input-group input:focus {
            border-color: #3b82f6;
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.25);
        }
        .error-msg {
            color: #f87171;
            font-size: 0.85rem;
            margin-top: 0.6rem;
            display: none;
            align-items: center;
            gap: 0.4rem;
        }
        .btn-submit {
            width: 100%;
            padding: 0.9rem;
            border: none;
            border-radius: 10px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #fff;
            font-size: 1.05rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            filter: brightness(1.1);
        }
        .btn-submit:active {
            transform: translateY(0);
        }
        .btn-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }
        
        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .shake {
            animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }
    </style>
</head>
<body>
    <div class="login-card" id="loginCard">
        <h2>Still Hear</h2>
        <p>This project is currently confidential. Please enter the decryption password to view details.</p>
        <form id="passwordForm">
            <div class="input-group">
                <label for="password">Enter Password</label>
                <div class="input-wrapper">
                    <input type="password" id="password" required placeholder="••••••••" autocomplete="current-password" autofocus>
                </div>
                <div class="error-msg" id="errorMsg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Incorrect password. Please try again.
                </div>
            </div>
            <button type="submit" class="btn-submit" id="submitBtn">
                <span id="btnText">Unlock Project Details</span>
                <div class="spinner" id="btnSpinner"></div>
            </button>
        </form>
    </div>

    <script>
        const encryptedData = "$ciphertextBase64";
        const saltHex = "$saltHex";
        const ivHex = "$ivHex";

        function hexToBytes(hex) {
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
            }
            return bytes;
        }

        function base64ToBytes(base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        }

        async function decryptContent(password) {
            const salt = hexToBytes(saltHex);
            const iv = hexToBytes(ivHex);
            const ciphertext = base64ToBytes(encryptedData);

            const encoder = new TextEncoder();
            const passwordBytes = encoder.encode(password);
            
            const baseKey = await crypto.subtle.importKey(
                "raw",
                passwordBytes,
                "PBKDF2",
                false,
                ["deriveKey"]
            );

            const aesKey = await crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: salt,
                    iterations: 100000,
                    hash: "SHA-256"
                },
                baseKey,
                {
                    name: "AES-CBC",
                    length: 256
                },
                false,
                ["decrypt"]
            );

            const decryptedBytes = await crypto.subtle.decrypt(
                {
                    name: "AES-CBC",
                    iv: iv
                },
                aesKey,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedBytes);
        }

        document.getElementById('passwordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const passwordInput = document.getElementById('password');
            const password = passwordInput.value;
            const errorMsg = document.getElementById('errorMsg');
            const submitBtn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const btnSpinner = document.getElementById('btnSpinner');
            const loginCard = document.getElementById('loginCard');

            errorMsg.style.display = 'none';
            btnText.style.display = 'none';
            btnSpinner.style.display = 'block';
            submitBtn.disabled = true;
            loginCard.classList.remove('shake');

            try {
                const decryptedHTML = await decryptContent(password);
                document.open();
                document.write(decryptedHTML);
                document.close();
            } catch (err) {
                console.error("Decryption failed:", err);
                setTimeout(() => {
                    btnSpinner.style.display = 'none';
                    btnText.style.display = 'block';
                    submitBtn.disabled = false;
                    errorMsg.style.display = 'flex';
                    loginCard.classList.add('shake');
                    passwordInput.value = '';
                    passwordInput.focus();
                }, 400);
            }
        });
    </script>
</body>
</html>
"@

    [System.IO.File]::WriteAllText($outPath, $template, [System.Text.Encoding]::UTF8)
    Write-Host "Success! Encrypted file written to $outPath"
} catch {
    Write-Error "Encryption failed: $_"
    exit 1
}
