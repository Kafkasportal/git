/**
 * Email Templates
 * Pre-configured HTML email templates for system notifications
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface ErrorNotificationData {
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userInfo?: {
    id: string;
    email: string;
    name: string;
  };
  url?: string;
}

interface WelcomeEmailData {
  userName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

interface PasswordResetData {
  userName: string;
  resetUrl: string;
  expiryHours: number;
}

interface AccountLockedData {
  userName: string;
  email: string;
  lockoutReason: string;
  unlockUrl?: string;
}

/**
 * Base HTML template wrapper with styling
 */
function wrapInTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .footer {
      background-color: #ecf0f1;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3498db;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
    .button:hover {
      background-color: #2980b9;
    }
    .alert {
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .alert-critical {
      background-color: #fee;
      border-left: 4px solid #e74c3c;
    }
    .alert-high {
      background-color: #fef5e7;
      border-left: 4px solid #f39c12;
    }
    .alert-medium {
      background-color: #ebf5fb;
      border-left: 4px solid #3498db;
    }
    .alert-low {
      background-color: #eafaf1;
      border-left: 4px solid #2ecc71;
    }
    .code-block {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      margin: 15px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ecf0f1;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${content}
  <div class="footer">
    <p>Bu e-posta Kafkasder Dernek Yönetim Sistemi tarafından otomatik olarak gönderilmiştir.</p>
    <p>© ${new Date().getFullYear()} Kafkasder. Tüm hakları saklıdır.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Error Notification Email Template
 */
export function createErrorNotificationEmail(data: ErrorNotificationData): EmailTemplate {
  const severityClass = `alert-${data.severity}`;
  const severityText = {
    critical: 'KRİTİK',
    high: 'YÜKSEK',
    medium: 'ORTA',
    low: 'DÜŞÜK',
  }[data.severity];

  const content = `
  <div class="container">
    <div class="header">
      <h1>⚠️ Sistem Hatası Bildirimi</h1>
    </div>
    <div class="content">
      <div class="alert ${severityClass}">
        <strong>Önem Seviyesi:</strong> ${severityText}
      </div>
      
      <h2>Hata Detayları</h2>
      <table>
        <tr>
          <th>Hata Kodu</th>
          <td>${data.errorCode}</td>
        </tr>
        <tr>
          <th>Hata Mesajı</th>
          <td>${data.errorMessage}</td>
        </tr>
        <tr>
          <th>Zaman</th>
          <td>${new Date(data.timestamp).toLocaleString('tr-TR')}</td>
        </tr>
        ${
          data.url
            ? `
        <tr>
          <th>URL</th>
          <td>${data.url}</td>
        </tr>
        `
            : ''
        }
        ${
          data.userInfo
            ? `
        <tr>
          <th>Kullanıcı</th>
          <td>${data.userInfo.name} (${data.userInfo.email})</td>
        </tr>
        `
            : ''
        }
      </table>

      ${
        data.stackTrace
          ? `
      <h3>Stack Trace</h3>
      <div class="code-block">
        ${data.stackTrace}
      </div>
      `
          : ''
      }

      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/errors" class="button">Hata Yönetim Paneline Git</a>
      </p>
    </div>
  </div>
  `;

  return {
    subject: `[${severityText}] Sistem Hatası: ${data.errorCode}`,
    html: wrapInTemplate(content, 'Sistem Hatası'),
    text: `HATA BİLDİRİMİ

Önem: ${severityText}
Kod: ${data.errorCode}
Mesaj: ${data.errorMessage}
Zaman: ${data.timestamp}`,
  };
}

/**
 * Welcome Email Template for New Users
 */
export function createWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const content = `
  <div class="container">
    <div class="header">
      <h1>🎉 Hoş Geldiniz!</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Kafkasder Dernek Yönetim Sistemine hoş geldiniz! Hesabınız başarıyla oluşturulmuştur.</p>

      <h3>Giriş Bilgileriniz</h3>
      <table>
        <tr>
          <th>E-posta</th>
          <td>${data.email}</td>
        </tr>
        <tr>
          <th>Geçici Şifre</th>
          <td><code>${data.temporaryPassword}</code></td>
        </tr>
      </table>

      <div class="alert alert-medium">
        <strong>Önemli:</strong> Güvenliğiniz için ilk giriş sonrası şifrenizi değiştirmeniz önerilir.
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${data.loginUrl}" class="button">Sisteme Giriş Yap</a>
      </p>

      <p>Herhangi bir sorunuz varsa, lütfen sistem yöneticiniz ile iletişime geçin.</p>
    </div>
  </div>
  `;

  return {
    subject: 'Kafkasder Yönetim Sistemine Hoş Geldiniz',
    html: wrapInTemplate(content, 'Hoş Geldiniz'),
    text: `Hoş Geldiniz!

E-posta: ${data.email}
Geçici Şifre: ${data.temporaryPassword}

Giriş: ${data.loginUrl}`,
  };
}

/**
 * Password Reset Email Template
 */
export function createPasswordResetEmail(data: PasswordResetData): EmailTemplate {
  const content = `
  <div class="container">
    <div class="header">
      <h1>🔒 Şifre Sıfırlama</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="button">Şifremi Sıfırla</a>
      </p>

      <div class="alert alert-medium">
        <strong>Dikkat:</strong> Bu bağlantı ${data.expiryHours} saat içinde geçerliliğini yitirecektir.
      </div>

      <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir.</p>

      <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
        Buton çalışmıyorsa şu bağlantıyı kopyalayıp tarayıcınıza yapıştırın:<br>
        ${data.resetUrl}
      </p>
    </div>
  </div>
  `;

  return {
    subject: 'Şifre Sıfırlama Talebi',
    html: wrapInTemplate(content, 'Şifre Sıfırlama'),
    text: `Şifre Sıfırlama

Merhaba ${data.userName},

Şifrenizi sıfırlamak için bu bağlantıyı kullanın:
${data.resetUrl}

Bağlantı ${data.expiryHours} saat geçerlidir.`,
  };
}

/**
 * Account Locked Email Template
 */
export function createAccountLockedEmail(data: AccountLockedData): EmailTemplate {
  const content = `
  <div class="container">
    <div class="header">
      <h1>🔐 Hesap Kilitlendi</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${data.userName}</strong>,</p>
      
      <div class="alert alert-high">
        <strong>Hesabınız güvenlik nedeniyle kilitlenmiştir.</strong>
      </div>

      <h3>Kilit Nedeni</h3>
      <p>${data.lockoutReason}</p>

      ${
        data.unlockUrl
          ? `
      <p>Hesabınızın kilidini açmak için:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.unlockUrl}" class="button">Hesap Kilidini Aç</a>
      </p>
      `
          : `
      <p>Hesabınızın kilidini açmak için lütfen sistem yöneticiniz ile iletişime geçin.</p>
      `
      }

      <div class="alert alert-medium">
        <strong>Güvenlik İpucu:</strong> Hesabınızı korumak için güçlü ve benzersiz şifreler kullanın.
      </div>
    </div>
  </div>
  `;

  return {
    subject: 'Hesabınız Kilitlendi - Güvenlik Uyarısı',
    html: wrapInTemplate(content, 'Hesap Kilitlendi'),
    text: `HESAP KİLİTLENDİ

Merhaba ${data.userName},

Hesabınız güvenlik nedeniyle kilitlenmiştir.

Neden: ${data.lockoutReason}

Yardım için sistem yöneticiniz ile iletişime geçin.`,
  };
}

/**
 * System maintenance notification
 */
export function createMaintenanceNotification(
  scheduledTime: string,
  duration: string,
  reason: string
): EmailTemplate {
  const content = `
  <div class="container">
    <div class="header">
      <h1>🔧 Planlı Bakım Bildirimi</h1>
    </div>
    <div class="content">
      <p>Sayın Kullanıcımız,</p>
      
      <p>Sistemimizde planlı bakım çalışması yapılacaktır. Bu süre zarfında sisteme erişim sağlanamayacaktır.</p>

      <table>
        <tr>
          <th>Bakım Zamanı</th>
          <td>${scheduledTime}</td>
        </tr>
        <tr>
          <th>Tahmini Süre</th>
          <td>${duration}</td>
        </tr>
        <tr>
          <th>Sebep</th>
          <td>${reason}</td>
        </tr>
      </table>

      <div class="alert alert-medium">
        <strong>Not:</strong> Bakım süresi uzayabilir veya kısalabilir. Sistem normale döndüğünde bilgilendirileceksiniz.
      </div>

      <p>Anlayışınız için teşekkür ederiz.</p>
    </div>
  </div>
  `;

  return {
    subject: 'Planlı Sistem Bakımı Bildirimi',
    html: wrapInTemplate(content, 'Planlı Bakım'),
    text: `PLANLI BAKIM

Zaman: ${scheduledTime}
Süre: ${duration}
Sebep: ${reason}`,
  };
}

/**
 * Export all template creators
 */
export const EmailTemplates = {
  errorNotification: createErrorNotificationEmail,
  welcome: createWelcomeEmail,
  passwordReset: createPasswordResetEmail,
  accountLocked: createAccountLockedEmail,
  maintenance: createMaintenanceNotification,
};
