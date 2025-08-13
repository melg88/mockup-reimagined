from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from scraper import LinkedInScraper
import json
import os

app = FastAPI(title="ImpulsAI Scraping API", version="1.0.0")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class JobRequest(BaseModel):
    position: str
    location: Optional[str] = "Brasil"
    limit: Optional[int] = 20

class JobResponse(BaseModel):
    cargo: str
    empresa: str
    localizacao: str
    competencias: List[str]

# Instância do scraper
scraper = LinkedInScraper()

@app.get("/")
async def root():
    return {"message": "ImpulsAI Scraping API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/scrape-jobs", response_model=List[JobResponse])
async def scrape_jobs(request: JobRequest):
    """
    Scrapes job listings from LinkedIn based on position and location
    """
    try:
        print(f"🔍 Scraping jobs for: {request.position} in {request.location}")
        
        # Scraping jobs
        jobs = await scraper.scrape_jobs(
            position=request.position,
            location=request.location,
            limit=request.limit
        )
        
        print(f"✅ Found {len(jobs)} jobs")
        return jobs
        
    except Exception as e:
        print(f"❌ Error scraping jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scraping jobs: {str(e)}")

@app.get("/jobs/{position}")
async def get_jobs_by_position(position: str, limit: int = 20):
    """
    Get jobs for a specific position (cached or scraped)
    """
    try:
        # Primeiro tenta buscar do cache
        cached_jobs = scraper.get_cached_jobs(position)
        if cached_jobs:
            return {"source": "cache", "jobs": cached_jobs[:limit]}
        
        # Se não há cache, faz scraping
        jobs = await scraper.scrape_jobs(position=position, limit=limit)
        return {"source": "scraped", "jobs": jobs}
        
    except Exception as e:
        print(f"❌ Error getting jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-cache")
async def update_cache():
    """
    Force update of job cache
    """
    try:
        await scraper.update_cache()
        return {"message": "Cache updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

