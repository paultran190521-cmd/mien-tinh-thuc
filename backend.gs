/**
 * SUNNYCARE MindWell — Google Apps Script Backend (FULL)
 * SpreadSheet ID: 1mTrJqZh5H9aS5JGKpEHb50q1ZYnQ-nE1Wa_Z3calcXs
 */

const SHEET_ID = '1mTrJqZh5H9aS5JGKpEHb50q1ZYnQ-nE1Wa_Z3calcXs';

// ─── MAIN DO-POST ───────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let result = {};

    switch(payload.action) {
      case 'submitTest':
        result = handleSubmitTest(payload);
        break;
      case 'register':
        result = handleRegister(payload);
        break;
      case 'login':
        result = handleLogin(payload);
        break;
      case 'getJournal':
        result = handleGetJournal(payload);
        break;
      case 'saveJournal':
        result = handleSaveJournal(payload);
        break;
      case 'adminStats':
        result = handleAdminStats(payload);
        break;
      default:
        throw new Error("Action not supported: " + payload.action);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── CORS ───────────────────────────────────────────────────────────────────
function doGet() {
  return ContentService.createTextOutput("SunnyCare API is active.");
}

// ─── UTILS ──────────────────────────────────────────────────────────────────
function getOrCreateSheet(sheetName, headers = []) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if(headers.length > 0) sheet.appendRow(headers);
  }
  return sheet;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16) + Date.now().toString(16); // make it look token-ish
}

// ─── AUTH (USERS) ───────────────────────────────────────────────────────────
function handleRegister(payload) {
  const { email, password, name } = payload;
  if(!email || !password || !name) throw new Error("Thiếu thông tin");

  const sheet = getOrCreateSheet('Users', ['Token', 'Email', 'PasswordHash', 'Name', 'CreatedAt']);
  const data = sheet.getDataRange().getValues();
  
  // Check if email exists
  for(let i=1; i<data.length; i++) {
    if(data[i][1] === email) {
      throw new Error("Email đã được sử dụng");
    }
  }

  const token = simpleHash(email + password);
  
  // Lưu trực tiếp mật khẩu không qua mã hóa theo yêu cầu
  sheet.appendRow([token, email, password, name, new Date()]);
  
  return { token, user: { name, email } };
}

function handleLogin(payload) {
  const { email, password } = payload;
  if(!email || !password) throw new Error("Thiếu thông tin");

  const sheet = getOrCreateSheet('Users', ['Token', 'Email', 'Password', 'Name', 'CreatedAt']);
  const data = sheet.getDataRange().getValues();
  
  for(let i=1; i<data.length; i++) {
    if(data[i][1] === email && data[i][2] == password) {
       return { token: data[i][0], user: { name: data[i][3], email } };
    }
  }
  
  throw new Error("Sai email hoặc mật khẩu");
}

// ─── JOURNAL ────────────────────────────────────────────────────────────────
function handleGetJournal(payload) {
  const { token } = payload;
  if(!token) throw new Error("Unauthorized");

  const sheet = getOrCreateSheet('Journal', ['Token', 'EntryId', 'Timestamp', 'Content', 'Mood']);
  const data = sheet.getDataRange().getValues();
  
  let entries = [];
  for(let i=1; i<data.length; i++) {
    if(data[i][0] === token) {
      entries.push({
        id: data[i][1],
        timestamp: data[i][2],
        content: data[i][3],
        mood: data[i][4]
      });
    }
  }
  
  return { entries };
}

function handleSaveJournal(payload) {
  const { token, entry } = payload;
  if(!token || !entry) throw new Error("Unauthorized or Empty");

  const sheet = getOrCreateSheet('Journal', ['Token', 'EntryId', 'Timestamp', 'Content', 'Mood']);
  const data = sheet.getDataRange().getValues();
  
  let found = false;
  // Try to update existing
  for(let i=1; i<data.length; i++) {
    if(data[i][0] === token && data[i][1] == entry.id) {
       sheet.getRange(i+1, 3, 1, 3).setValues([[ entry.timestamp, entry.content, entry.mood ]]);
       found = true;
       break;
    }
  }
  
  // Or append new
  if(!found) {
    sheet.appendRow([token, entry.id, entry.timestamp, entry.content, entry.mood]);
  }
  
  return { status: "Saved", id: entry.id };
}

// ─── TEST HANDLING ──────────────────────────────────────────────────────────
function handleSubmitTest(payload) {
  const { testType, name, phone, email, answers, scores, lang } = payload;
  
  const sheetName = `${testType}_Results`;
  let headers = ['Timestamp', 'Name', 'Phone', 'Email', 'TotalScore', 'Severity_VI', 'Severity_EN'];
  if(answers) {
    for(let i=0; i < answers.length; i++) { headers.push(`Q${i+1}`); }
  }
  headers.push('EmailSent');
  
  let sheet = getOrCreateSheet(sheetName, headers);
  
  let rowData = [
    new Date(),
    name,
    phone || '',
    email,
    scores.total,
    scores.severity_vi,
    scores.severity_en
  ];
  if(answers) answers.forEach(a => rowData.push(a));
  
  // Send Email
  let emailSent = false;
  try {
    sendResultEmail(testType, name, email, scores, lang);
    emailSent = true;
  } catch(e) {
    console.error("Email Error:", e);
  }
  
  rowData.push(emailSent ? 'Yes' : 'No');
  sheet.appendRow(rowData);
  
  return { status: "Saved", testType, name };
}

// ─── ADMIN STATS ───────────────────────────────────────────────────────────
function handleAdminStats(payload) {
   if(payload.password !== 'sunnycare2024') throw new Error("Unauthorized");
   
   // Just grabbing total rows for demo metric
   const resultSheets = ['PHQ9_Results', 'GAD7_Results', 'DASS21_Results', 'ACE_Results'];
   const ss = SpreadsheetApp.openById(SHEET_ID);
   
   let totalTests = 0;
   let riskTests = 0;
   
   resultSheets.forEach(name => {
      let sheet = ss.getSheetByName(name);
      if(sheet) {
         totalTests += Math.max(0, sheet.getLastRow() - 1);
      }
   });
   
   let userSheet = ss.getSheetByName('Users');
   let totalUsers = userSheet ? Math.max(0, userSheet.getLastRow() - 1) : 0;
   
   return { totalTests, riskTests: totalTests > 0 ? Math.floor(totalTests * 0.1) : 0, totalUsers };
}

// ─── EMAIL SYSTEM ───────────────────────────────────────────────────────────
function sendResultEmail(testType, name, userEmail, scores, lang) {
  const isEng = (lang === 'en');
  
  const titleMap = {
    'PHQ9': isEng ? 'PHQ-9 Depression Screening Result' : 'Kết Quả Trắc Nghiệm Trầm Cảm PHQ-9',
    'GAD7': isEng ? 'GAD-7 Anxiety Screening Result' : 'Kết Quả Trắc Nghiệm Lo Âu GAD-7',
    'DASS21': isEng ? 'DASS-21 Psychological Screening Result' : 'Kết Quả Trắc Nghiệm DASS-21',
    'ACE': isEng ? 'ACE Score Result' : 'Kết Quả Khảo Sát Tuổi Thơ ACE'
  };

  const severityColorMap = {
    'minimal': '#22c55e', 
    'mild': '#f59e0b',    
    'moderate': '#eab308',
    'severe': '#ef4444'   
  };

  const color = severityColorMap[scores.cssClass] || '#1992b0';
  const severityText = isEng ? scores.severity_en : scores.severity_vi;
  const descText = isEng ? scores.desc_en : scores.desc_vi;
  const totalScoreVal = scores.total;
  
  const subject = `[SunnyCare] ${titleMap[testType]}`;

  const htmlBody = `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #071520 0%, #1992b0 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">SUNNYCARE</h1>
      <p style="color: #8ed6ec; margin: 5px 0 0 0; font-size: 14px;">Viện Tâm Lý</p>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
        ${isEng ? `Dear <strong>${name}</strong>,` : `Kính gửi <strong>${name}</strong>,`}
      </p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 30px;">
        ${isEng ? 
          `Thank you for taking the time to complete the ${titleMap[testType]}. Facing our emotions is a brave first step on the healing journey.` : 
          `Bên cạnh bạn trên hành trình chăm sóc sức khỏe tinh thần, SunnyCare gửi đến bạn kết quả <strong>${titleMap[testType]}</strong> bạn vừa thực hiện.`}
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
        <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px;">
          ${isEng ? 'Your Score' : 'Điểm Của Bạn'}
        </span>
        <div style="font-size: 44px; font-weight: 900; color: ${color}; line-height: 1.2; margin: 10px 0;">
          ${totalScoreVal}
        </div>
        <div style="font-size: 20px; font-weight: bold; color: ${color}; margin-bottom: 15px;">
          ${severityText}
        </div>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0; text-align: left; padding: 0 10px;">
          ${descText}
        </p>
      </div>
      <div style="text-align: center;">
        <a href="https://www.sunnycare.vn/dat-lich-hen" style="display: inline-block; background-color: #ff9500; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${isEng ? 'Book a Consultation' : 'Đặt Lịch Chuyên Gia Tâm Lý'}
        </a>
      </div>
    </div>
    <div style="background-color: #f1f5f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin: 0 0 15px 0;">
        ⚠️ ${isEng ? '<strong>Disclaimer:</strong> This is a screening tool, not a clinical diagnosis. If you are experiencing severe distress or crisis, please seek immediate help.' : '<strong>Khuyến cáo:</strong> Kết quả này chỉ mang tính tham khảo, không thay thế chẩn đoán y tế. Nếu bạn đang trong khủng hoảng, xin vui lòng tìm kiếm hỗ trợ ngay lập tức.'}<br>
        Hotline: <strong>089 639 7968</strong>
      </p>
    </div>
  </div>
  `;

  GmailApp.sendEmail(userEmail, subject, "", { htmlBody, name: "SUNNYCARE | Viện Tâm Lý" });
}

// ─── INIT SCRIPT ────────────────────────────────────────────────────────────
function setupDatabase() {
  Logger.log("Bắt đầu khởi tạo các Sheets dữ liệu...");
  getOrCreateSheet('Users', ['Token', 'Email', 'PasswordHash', 'Name', 'CreatedAt']);
  getOrCreateSheet('Journal', ['Token', 'EntryId', 'Timestamp', 'Content', 'Mood']);
  
  // Khởi tạo các Sheet cho Test
  const testTypes = { 'PHQ9': 9, 'GAD7': 7, 'DASS21': 21, 'ACE': 10 };
  
  for (const [testType, qCount] of Object.entries(testTypes)) {
    const sheetName = `${testType}_Results`;
    let headers = ['Timestamp', 'Name', 'Phone', 'Email', 'TotalScore', 'Severity_VI', 'Severity_EN'];
    for(let i=1; i <= qCount; i++) { headers.push(`Q${i}`); }
    headers.push('EmailSent');
    getOrCreateSheet(sheetName, headers);
  }
  Logger.log("Khởi tạo thành công! Kiểm tra Google Sheet của bạn.");
}
