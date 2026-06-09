from fastapi import APIRouter, HTTPException

from db import get_job

router = APIRouter()


@router.get("/api/jobs/{job_id}")
def api_get_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
