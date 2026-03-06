export const baseEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0B1220;
      font-family: Arial, sans-serif;
      color: #FFFFFF;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #111827;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1F2937;
    }
    .header {
      padding: 24px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      background: linear-gradient(135deg, #1E3A8A, #2563EB);
    }
    .content {
      padding: 24px;
      font-size: 15px;
      line-height: 1.6;
      color: #E5E7EB;
    }
    .code {
      margin: 24px 0;
      padding: 16px;
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #2563EB;
      background-color: #0B1220;
      border-radius: 8px;
      border: 1px dashed #2563EB;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background-color: #2563EB;
      color: #FFFFFF !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
      border-top: 1px solid #1F2937;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">${title}</div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} GIKI JournalHub. This is an automated email.
    </div>
  </div>
</body>
</html>
`;
