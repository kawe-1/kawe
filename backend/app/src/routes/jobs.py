from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.repositories import JobRepository

router = APIRouter()


@router.get("/api/jobs/{job_id}")
def api_get_job(job_id: str, db: Session = Depends(get_db)):
    repo = JobRepository(db=db)
    job = repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
