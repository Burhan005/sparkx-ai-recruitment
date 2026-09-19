"""
Database Inspector Script for SparkX AI Recruitment
Prints all live database tables and entries directly to the console.
"""
from database import SessionLocal
from models import JobModel, CandidateModel, IntegrityLogModel

def inspect():
    db = SessionLocal()
    try:
        print("\n" + "="*70)
        print("  ⚡ SPARKX LIVE DATABASE INSPECTOR (PostgreSQL / SQLite)")
        print("="*70)

        # 1. Inspect Jobs Table
        jobs = db.query(JobModel).all()
        print(f"\n📁 TABLE: 'jobs' ({len(jobs)} records)")
        print("-" * 70)
        for j in jobs:
            print(f" • [ID: {j.id}] | Title: {j.title}")
            print(f"   Department: {j.department} | Exp: {j.experience} | Status: {j.status}")
            print(f"   Skills: {', '.join(j.required_skills or [])}")
            print(f"   Questions Generated: {len(j.questions or [])} questions")
            print()

        # 2. Inspect Candidates Table
        candidates = db.query(CandidateModel).all()
        print(f"\n👥 TABLE: 'candidates' ({len(candidates)} records)")
        print("-" * 70)
        for c in candidates:
            print(f" • [ID: {c.id}] | Name: {c.name} ({c.email})")
            print(f"   Job ID: {c.job_id} | Applied: {c.applied_date} | Status: {c.status}")
            print(f"   Match Score: {c.match_score}% | Integrity: {c.integrity_score}/100 ({c.integrity_risk} Risk)")
            print(f"   Final Decision: {c.final_decision}")
            if c.fraud_flags:
                print(f"   ⚠️ Fraud Flags: {c.fraud_flags}")
            print()

        # 3. Inspect Integrity Logs Table
        logs = db.query(IntegrityLogModel).all()
        print(f"\n🛡️ TABLE: 'integrity_logs' ({len(logs)} records)")
        print("-" * 70)
        for l in logs:
            print(f" • [{l.timestamp}] [{l.event_type}] Candidate: {l.candidate_id} | {l.description}")

        print("\n" + "="*70)
        print("  Database verification completed successfully.")
        print("="*70 + "\n")

    finally:
        db.close()

if __name__ == "__main__":
    inspect()
