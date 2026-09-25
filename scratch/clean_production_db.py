"""
Clean up test security roles, test users, and dummy test candidates from sparkx_recruitment.db.
Preserves:
- All real user accounts (bkapasi472@rku.ac.in, burhan.kapasi985@gmail.com, admin@sparkx.ai, candidate@sparkx.ai)
- All real candidate applications submitted by Burhan
- Legitimate job openings
"""
import sys
import os
sys.path.append(os.path.abspath("backend"))

from database import SessionLocal
from models.db_models import JobModel, CandidateModel, UserModel, IntegrityLogModel

def clean_database():
    db = SessionLocal()
    try:
        print("--- Starting Production Database Sanitization ---")

        # 1. Delete all "Test Security Role" and scratch test jobs
        test_job_titles = ["Test Security Role"]
        jobs_to_delete = db.query(JobModel).filter(
            (JobModel.title.in_(test_job_titles)) |
            (JobModel.title.like("%Test%")) |
            (JobModel.id.like("job-test-%")) |
            (JobModel.id.in_(["job-d4f516", "job-8e0228", "job-e00a43"]))
        ).all()

        deleted_job_ids = []
        for j in jobs_to_delete:
            print(f"Deleting test job: {j.id} - {j.title}")
            # Delete candidates attached to this test job first
            cands = db.query(CandidateModel).filter(CandidateModel.job_id == j.id).all()
            for c in cands:
                print(f"  Deleting candidate from test job: {c.id} - {c.name} ({c.email})")
                db.delete(c)
            deleted_job_ids.append(j.id)
            db.delete(j)

        db.commit()
        print(f"Removed {len(deleted_job_ids)} test jobs.")

        # 2. Delete test / dummy candidates
        dummy_cands = db.query(CandidateModel).filter(
            (CandidateModel.name.like("%Candidate Alpha%")) |
            (CandidateModel.name.like("%Candidate Beta%")) |
            (CandidateModel.name.like("%Blank Submitter%")) |
            (CandidateModel.name.like("%Alex Tech Cloud%")) |
            (CandidateModel.name.like("%Sarah Controller%")) |
            (CandidateModel.name.like("%Cloud Candidate Test%")) |
            (CandidateModel.name.like("%(Flagged Profile)%")) |
            (CandidateModel.email.like("%test%@sparkx.ai")) |
            (CandidateModel.email.like("%@example.com") & ~CandidateModel.name.like("Aarav Sharma") & ~CandidateModel.name.like("Burhan%")) |
            (CandidateModel.email.like("%@tempmail.org"))
        ).all()

        for c in dummy_cands:
            print(f"Deleting dummy candidate: {c.id} - {c.name} ({c.email})")
            db.delete(c)

        db.commit()

        # 3. Delete test users from users table
        test_users = db.query(UserModel).filter(
            (UserModel.email.in_(["test_cand_a@sparkx.ai", "test_cand_b@sparkx.ai", "test_recruiter@sparkx.ai", "aarav.test@sparkx.ai"])) |
            (UserModel.name.in_(["Candidate Alpha", "Candidate Beta", "Recruiter Admin"]))
        ).all()

        for u in test_users:
            print(f"Deleting test user: {u.id} - {u.name} ({u.email})")
            db.delete(u)

        db.commit()

        # 4. Clean up any integrity logs orphaned
        remaining_cand_ids = [c.id for c in db.query(CandidateModel.id).all()]
        orphaned_logs = db.query(IntegrityLogModel).filter(~IntegrityLogModel.candidate_id.in_(remaining_cand_ids)).all()
        for l in orphaned_logs:
            db.delete(l)
        db.commit()

        print("\n--- Summary of Remaining Database Entities ---")
        print("\nUSERS:")
        for u in db.query(UserModel).all():
            print(f"  {u.id} | {u.name} | {u.email} | {u.role}")

        print("\nJOBS:")
        for j in db.query(JobModel).all():
            print(f"  {j.id} | {j.title} | {j.department}")

        print("\nCANDIDATES:")
        for c in db.query(CandidateModel).all():
            print(f"  {c.id} | {c.name} | {c.email} | Job: {c.job_id} | Status: {c.status}")

        print("\n[SUCCESS] Database cleaned and sanitized for production!")

    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
