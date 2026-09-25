import re

def smart_skill_match(req, text, cand_skills):
    req_clean = req.lower().strip()
    text_lower = text.lower()
    
    # 1. Direct match in cand_skills
    for cs in cand_skills:
        cs_clean = cs.lower().strip()
        if req_clean == cs_clean or req_clean in cs_clean or cs_clean in req_clean:
            return True
            
    # 2. Whole exact phrase in text
    if re.search(r'\b' + re.escape(req_clean) + r'\b', text_lower):
        return True
        
    # 3. Plural/singular or common inflection check
    # e.g., reconciliation -> reconciliations, audit -> audits/auditing
    tokens = re.findall(r'[a-z]+', req_clean)
    if len(tokens) == 1:
        tok = tokens[0]
        # check stem
        stem = tok[:-1] if tok.endswith('s') else tok
        if re.search(r'\b' + re.escape(stem) + r'[a-z]*\b', text_lower):
            return True
    else:
        # Multi-word: check if all major tokens or their stems appear in text
        # e.g. "Financial Reconciliation" -> "financial" and "reconcil"
        # e.g. "Internal Auditing" -> "internal" / "audit" / "ledger audits"
        # e.g. "Variance Analysis" -> "variance" and "analy" / "audits"
        key_tokens = [t for t in tokens if t not in ("and", "or", "of", "in", "to", "for", "with")]
        stems = [t[:5] if len(t) > 5 else t for t in key_tokens]
        
        # If the head/primary noun matches (e.g. reconcil*, audit*, analy*)
        matches_per_token = [bool(re.search(r'\b' + re.escape(s) + r'[a-z]*\b', text_lower)) for s in stems]
        # For 2-word skills: either both match, or the primary domain root matches
        if all(matches_per_token):
            return True
        # Domain head noun matches in relevant context
        if "reconciliation" in req_clean and re.search(r'\breconcil[a-z]*\b', text_lower):
            return True
        if "auditing" in req_clean and re.search(r'\baudit[a-z]*\b', text_lower):
            return True
        if "analysis" in req_clean and (re.search(r'\banaly[a-z]*\b', text_lower) or re.search(r'\bvariance\b', text_lower)):
            return True

    return False

# Test with user resume
resume_text = """ew York, NY (Hybrid) | (555) 123-4567 | burhan.kapasi@example.com | linkedin.com/in/burhankapasi
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

job_skills = ["GAAP", "Financial Reconciliation", "Corporate Tax", "Internal Auditing", "Variance Analysis"]
for req in job_skills:
    print(f"{req}: {smart_skill_match(req, resume_text, [])}")
