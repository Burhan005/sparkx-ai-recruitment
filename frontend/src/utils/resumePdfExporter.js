/**
 * SparkX AI Recruitment - Professional Resume PDF Exporter
 * Generates a clean, authentic printable Candidate Dossier using ONLY genuine candidate evidence.
 * Zero hardcoded companies, zero fabricated scores, zero fake employers.
 */

export function generateResumeHTML(candidate) {
  if (!candidate) return '';

  const name = candidate.name || 'Candidate';
  const email = candidate.email || 'Not provided';
  const phone = candidate.phone || 'Not provided';
  const role = candidate.jobTitle || candidate.job?.title || 'Applicant';
  const experienceYears = candidate.experienceYears ?? candidate.experience_years;
  const matchScore = candidate.matchScore ?? candidate.match_score;
  const education = candidate.education || 'Not specified';
  const location = candidate.location || 'Not specified';

  // Genuine skills list
  let skills = [];
  if (Array.isArray(candidate.skills)) {
    skills = candidate.skills;
  } else if (typeof candidate.skills === 'string') {
    skills = candidate.skills.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Genuine summary
  const summary = candidate.resumeSummary || candidate.resume_summary || 
    (candidate.resumeText ? candidate.resumeText.slice(0, 300) + '...' : 'Profile details extracted from candidate application.');

  // Genuine raw resume text if available
  const resumeText = candidate.resumeText || candidate.resume_text || '';

  // Actual scores
  const techScore = candidate.scores?.technicalScore ?? candidate.codingScore;
  const problemSolvingScore = candidate.scores?.problemSolving;
  const integrityScore = candidate.integrityScore ?? candidate.integrity_score;
  const integrityRisk = candidate.integrityRisk || candidate.integrity_risk || 'Standard';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name} - Verified Candidate Dossier</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    @page {
      size: A4 portrait;
      margin: 14mm 16mm;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F8FAFC;
      color: #1E293B;
      line-height: 1.5;
      font-size: 13px;
    }
    
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 32px 36px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #C27803;
      padding-bottom: 18px;
      margin-bottom: 22px;
      gap: 16px;
    }
    
    .header-left h1 {
      font-size: 24px;
      font-weight: 800;
      color: #1C130E;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    
    .header-left .role {
      font-size: 14px;
      font-weight: 600;
      color: #C27803;
      margin-bottom: 10px;
    }
    
    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 18px;
      font-size: 11.5px;
      color: #475569;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .score-badge {
      background: #FFFBEB;
      border: 1.5px solid #C27803;
      border-radius: 10px;
      padding: 10px 16px;
      text-align: center;
      min-width: 100px;
      font-size: 11px;
      font-weight: 700;
      color: #92400E;
    }
    
    .score-badge span {
      display: block;
      font-size: 22px;
      font-weight: 800;
      color: #C27803;
      line-height: 1;
      margin-bottom: 2px;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0D9488;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    
    .summary-text {
      color: #334155;
      font-size: 12.5px;
      line-height: 1.6;
    }
    
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .skill-pill {
      background: #F1F5F9;
      color: #334155;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 3px 9px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .resume-raw-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      line-height: 1.6;
      color: #334155;
      white-space: pre-wrap;
      max-height: 380px;
      overflow-y: auto;
    }
    
    .telemetry-grid {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .telemetry-item {
      font-size: 11px;
    }
    
    .telemetry-label {
      color: #64748B;
      display: block;
      margin-bottom: 2px;
      text-transform: uppercase;
      font-size: 9.5px;
      font-weight: 700;
    }
    
    .telemetry-value {
      font-size: 13px;
      font-weight: 800;
      color: #0F172A;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94A3B8;
    }
    
    @media print {
      body {
        background: #FFFFFF;
      }
      .container {
        padding: 0;
        max-width: 100%;
        border: none;
        box-shadow: none;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Top Action Bar (hidden when printing) -->
    <div class="no-print" style="margin-bottom: 18px; padding: 12px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 12px; font-weight: 600; color: #92400E;">
        Verified Candidate Application Dossier — Ready to Print / Save as PDF
      </span>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.print()" style="background: #C27803; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer;">
          Save / Print as PDF
        </button>
        <button onclick="window.close()" style="background: white; color: #475569; border: 1px solid #CBD5E1; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
          Close
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>${name}</h1>
        <div class="role">${role}</div>
        <div class="contact-bar">
          <div class="contact-item">Email: ${email}</div>
          <div class="contact-item">Phone: ${phone}</div>
          <div class="contact-item">Location: ${location}</div>
          ${experienceYears != null ? `<div class="contact-item">Experience: ${experienceYears} Yrs</div>` : ''}
        </div>
      </div>
      <div class="header-right">
        <div class="score-badge">
          <span>${matchScore != null ? `${matchScore}%` : 'N/A'}</span>
          Role Match
        </div>
      </div>
    </div>

    <!-- Professional Summary -->
    <div class="section">
      <div class="section-title">1. Professional Summary</div>
      <div class="summary-text">${summary}</div>
    </div>

    <!-- Core Competencies -->
    ${skills.length > 0 ? `
    <div class="section">
      <div class="section-title">2. Verified Skills & Competencies</div>
      <div class="skills-grid">
        ${skills.map(s => `<span class="skill-pill">${s}</span>`).join('')}
      </div>
    </div>` : ''}

    <!-- Education & Credentials -->
    <div class="section">
      <div class="section-title">3. Education & Credentials</div>
      <div class="summary-text">
        <strong>Education:</strong> ${education}
      </div>
    </div>

    <!-- Extracted Resume Text -->
    ${resumeText.trim() ? `
    <div class="section">
      <div class="section-title">4. Extracted Resume Content</div>
      <div class="resume-raw-box">${resumeText.trim()}</div>
    </div>` : ''}

    <!-- Evaluation Telemetry -->
    <div class="section">
      <div class="section-title">5. Evaluation Telemetry</div>
      <div class="telemetry-grid">
        <div class="telemetry-item">
          <span class="telemetry-label">Technical Code Score</span>
          <span class="telemetry-value">${techScore != null ? `${techScore}%` : 'Pending'}</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">Problem Solving</span>
          <span class="telemetry-value">${problemSolvingScore != null ? `${problemSolvingScore}%` : 'Pending'}</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">Integrity Verification</span>
          <span class="telemetry-value">${integrityScore != null ? `${integrityScore}% (${integrityRisk})` : 'Pending'}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>Generated by ARETE Talent Intelligence Operating System</span>
      <span>Confidential Evaluation Record — Authoritative Database Grounding</span>
    </div>
  </div>
</body>
</html>`;
}

export function exportResumeAsPDF(candidate) {
  const htmlContent = generateResumeHTML(candidate);
  if (!htmlContent) return;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow popups to export the candidate resume PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
