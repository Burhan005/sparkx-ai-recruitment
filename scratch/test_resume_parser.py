import re

def parse_resume_text(text: str):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return {}

    # Email
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    email = email_match.group(0) if email_match else ""

    # Phone
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0) if phone_match else ""

    # Name: look at first line or line with "Resume"
    name = ""
    name_line_match = re.search(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s*[-–—]\s*Resume', text, re.MULTILINE)
    if name_line_match:
        name = name_line_match.group(1)
    else:
        # Check first 3 lines
        for l in lines[:3]:
            if "@" not in l and "http" not in l and len(l.split()) in (2, 3) and not any(ch.isdigit() for ch in l):
                name = l
                break
        if not name and email:
            # Derive from email prefix
            parts = email.split("@")[0].replace(".", " ").replace("_", " ").title()
            name = parts

    # Experience Years: Year ranges (e.g., 2017 – 2020, 2021 – Present)
    current_year = 2026
    ranges = re.findall(r'\b(20\d\d)\s*[-–—to]+\s*(present|current|now|20\d\d)\b', text.lower())
    total_exp = 0.0
    for s_yr, e_yr in ranges:
        start = int(s_yr)
        end = current_year if e_yr in ("present", "current", "now") else int(e_yr)
        if end >= start:
            total_exp += (end - start)
    if total_exp == 0.0:
        exp_m = re.search(r'(\d+)\+?\s*years?', text.lower())
        if exp_m:
            total_exp = float(exp_m.group(1))

    # Education
    edu_list = []
    edu_terms = [
        "Master of Accounting", "Bachelor of Science in Finance", "Certified Public Accountant (CPA)",
        "CPA", "Master of Business Administration (MBA)", "B.Tech in Computer Science",
        "M.Tech", "B.S. in Computer Science", "B.Com", "M.Com", "Bachelor", "Master", "PhD"
    ]
    for term in edu_terms:
        if re.search(r'\b' + re.escape(term) + r'\b', text, re.I):
            if term not in edu_list:
                edu_list.append(term)
    education = ", ".join(edu_list[:3]) if edu_list else "Bachelor's Degree"

    # Job Role
    role = ""
    role_match = re.search(r'(?:Senior|Lead|Principal|Staff|Associate)?\s*(?:Financial Controller & Tax Auditor|Financial Controller|Tax Auditor|Cloud Engineer|Software Engineer|Full-Stack Engineer|Data Scientist|Accountant)', text, re.I)
    if role_match:
        role = role_match.group(0).strip()

    # Skills: Check under "Core Competencies" or "Skills" section
    skills = []
    competency_section = re.search(r'(?:Core Competencies|Skills|Technical Skills)\s*([\s\S]*?)(?:Professional Experience|Experience|Education|$)', text, re.I)
    if competency_section:
        raw_skills = competency_section.group(1)
        for line in raw_skills.splitlines():
            line = line.strip().strip("•-*")
            if line and len(line) < 40 and not line.lower().startswith("professional"):
                # Clean up e.g. "GAAP / IFRS Reconciliations"
                parts = re.split(r'[/,;]', line)
                for p in parts:
                    clean_p = p.strip()
                    if clean_p and len(clean_p) > 1 and clean_p not in skills:
                        skills.append(clean_p)

    # Summary
    summary = ""
    sum_match = re.search(r'(?:Strategic|Experienced|Certified|Senior|Dedicated)[\s\S]*?\.\s*(?=[A-Z][a-z]+ [A-Z]|\n\n)', text)
    if sum_match:
        summary = sum_match.group(0).strip().replace("\n", " ")

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "experience_years": round(total_exp, 1),
        "education": education,
        "job_role": role,
        "skills": skills,
        "resume_summary": summary[:400] if summary else text[:300]
    }

user_text = """ew York, NY (Hybrid) | (555) 123-4567 | burhan.kapasi@example.com | linkedin.com/in/burhankapasi

Strategic and highly analytical Certified Public Accountant (CPA) with extensive expertise in financial controllership, corporate tax strategy, and audit readiness. Specializes in managing complex financial operations for enterprise organizations, ensuring strict adherence to evolving compliance standards. Proven track record of leading highly precise GAAP and IFRS balance sheet reconciliations, executing comprehensive month-end ledger audits, and identifying critical cost-saving opportunities through rigorous variance analysis.
Core Competencies
GAAP / IFRS Reconciliations
Month-End Ledger Audits
Variance Audits & Analysis
Corporate Tax Compliance
Financial Reporting
Enterprise Resource Planning (ERP)
Professional Experience
Senior Financial Controller & Tax Auditor
Jan 2021 – Present
Vertex Financial Group (Targeting SparkX Technologies profile)
New York, NY (Hybrid)
Lead quarterly GAAP and IFRS balance sheet reconciliations for a $120M+ portfolio, ensuring 100% precision in executive financial reporting and stakeholder presentations.
Direct comprehensive month-end and year-end ledger audits, coordinating across operational teams to resolve discrepancies and close books within a strict 4-day timeline.
Conduct detailed variance audits across core departments, identifying budget-to-actual deviations that resulted in the recovery of $1.5M in annual operational inefficiencies.
Oversee multi-state corporate tax compliance and preparation, serving as the primary liaison with external auditors and state tax authorities to ensure zero compliance penalties.
Senior Tax Auditor
Jun 2017 – Dec 2020
Axiom Accounting Partners
New York, NY
Managed end-to-end corporate tax compliance for 45+ mid-to-large cap enterprise clients, ensuring adherence to rapidly changing federal and state tax regulations.
Performed deep-dive variance audits on client financial statements to ensure uncompromising audit readiness, successfully reducing audit preparation time by 30%.
Assisted senior controllers with complex GAAP balance sheet reconciliations, ledger health checks, and the implementation of automated data extraction tools.
Education & Credentials
Master of Accounting
Columbia Business School, New York, NY
May 2017
Bachelor of Science in Finance
New York University (NYU), New York, NY
May 2015
Licenses & Certifications:
Certified Public Accountant (CPA) – Active, State of New York
Burhan Kapasi - Resume"""

parsed = parse_resume_text(user_text)
import json
print(json.dumps(parsed, indent=2))
