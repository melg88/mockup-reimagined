import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import re
import time

class LinkedInScraper:
    def __init__(self):
        self.cache_file = "job_cache.json"
        self.cache_duration = timedelta(hours=6)  # Cache por 6 horas
        self.driver = None
        self.is_logged_in = False
        
    def setup_driver(self):
        """Configura o driver do Chrome"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Executar em background
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        return self.driver
    
    async def login(self):
        """Login no LinkedIn (opcional - para mais dados)"""
        if self.is_logged_in:
            return
            
        email = os.getenv("LINKEDIN_EMAIL")
        password = os.getenv("LINKEDIN_PASSWORD")
        
        if not email or not password:
            print("⚠️ LinkedIn credentials not found. Using public data only.")
            return
            
        try:
            self.driver.get("https://www.linkedin.com/login")
            
            # Login
            email_field = self.driver.find_element(By.ID, "username")
            password_field = self.driver.find_element(By.ID, "password")
            
            email_field.send_keys(email)
            password_field.send_keys(password)
            
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            # Aguardar login
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "global-nav"))
            )
            
            self.is_logged_in = True
            print("✅ Logged in to LinkedIn")
            
        except Exception as e:
            print(f"❌ Login failed: {e}")
    
    def extract_skills_from_description(self, description: str) -> List[str]:
        """Extrai competências da descrição da vaga usando regex e palavras-chave"""
        skills = []
        
        # Lista de competências técnicas comuns
        tech_skills = [
            "JavaScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust",
            "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "Flask",
            "Spring Boot", "Laravel", "Rails", "ASP.NET", "FastAPI",
            "HTML", "CSS", "Sass", "Less", "TypeScript", "CoffeeScript",
            "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Elasticsearch",
            "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Heroku",
            "Git", "GitHub", "GitLab", "Bitbucket", "SVN",
            "Jenkins", "Travis CI", "CircleCI", "GitHub Actions",
            "Linux", "Unix", "Windows", "macOS",
            "REST API", "GraphQL", "SOAP", "gRPC",
            "Machine Learning", "AI", "Data Science", "Big Data",
            "Agile", "Scrum", "Kanban", "TDD", "BDD", "CI/CD"
        ]
        
        # Buscar competências na descrição
        description_lower = description.lower()
        for skill in tech_skills:
            if skill.lower() in description_lower:
                skills.append(skill)
        
        # Extrair competências usando regex
        skill_patterns = [
            r'\b(?:knowledge of|experience with|proficient in|expertise in)\s+([A-Za-z\s+#]+)',
            r'\b([A-Za-z]+(?:\.[A-Za-z]+)*)\s+(?:framework|library|tool|technology)',
            r'\b(?:React|Angular|Vue|Node|Python|Java|JavaScript|TypeScript|C\+\+|C#|PHP|Ruby|Go|Rust)\b'
        ]
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, description, re.IGNORECASE)
            for match in matches:
                skill = match.strip()
                if skill and skill not in skills and len(skill) > 2:
                    skills.append(skill)
        
        return list(set(skills))[:15]  # Limitar a 15 competências
    
    async def scrape_jobs(self, position: str, location: str = "Brasil", limit: int = 20) -> List[Dict]:
        """Scrapes job listings from LinkedIn"""
        try:
            if not self.driver:
                self.setup_driver()
            
            # Construir URL de busca
            search_query = f"{position} {location}"
            search_url = f"https://www.linkedin.com/jobs/search/?keywords={position}&location={location}"
            
            print(f"🔍 Searching: {search_url}")
            self.driver.get(search_url)
            
            # Aguardar carregamento
            time.sleep(3)
            
            jobs = []
            job_cards = self.driver.find_elements(By.CSS_SELECTOR, ".job-search-card")
            
            for i, card in enumerate(job_cards[:limit]):
                try:
                    # Extrair informações básicas
                    title_elem = card.find_element(By.CSS_SELECTOR, ".job-search-card__title")
                    company_elem = card.find_element(By.CSS_SELECTOR, ".job-search-card__subtitle")
                    location_elem = card.find_element(By.CSS_SELECTOR, ".job-search-card__location")
                    
                    title = title_elem.text.strip()
                    company = company_elem.text.strip()
                    job_location = location_elem.text.strip()
                    
                    # Clicar no card para abrir detalhes
                    card.click()
                    time.sleep(2)
                    
                    # Extrair descrição
                    description_elem = self.driver.find_element(By.CSS_SELECTOR, ".description__text")
                    description = description_elem.text.strip()
                    
                    # Extrair competências
                    skills = self.extract_skills_from_description(description)
                    
                    job_data = {
                        "cargo": title,
                        "empresa": company,
                        "localizacao": job_location,
                        "competencias": skills,
                        "descricao": description[:500] + "..." if len(description) > 500 else description
                    }
                    
                    jobs.append(job_data)
                    print(f"✅ Scraped job {i+1}: {title} at {company}")
                    
                except Exception as e:
                    print(f"⚠️ Error scraping job {i+1}: {e}")
                    continue
            
            # Salvar no cache
            self.save_to_cache(position, jobs)
            
            return jobs
            
        except Exception as e:
            print(f"❌ Error in scrape_jobs: {e}")
            # Fallback para dados estáticos
            return self.get_fallback_data(position)
    
    def get_fallback_data(self, position: str) -> List[Dict]:
        """Retorna dados de fallback quando scraping falha"""
        try:
            with open("../vagas.json", "r", encoding="utf-8") as f:
                all_jobs = json.load(f)
            
            # Filtrar por posição similar
            position_lower = position.lower()
            filtered_jobs = []
            
            for job in all_jobs:
                if any(keyword in job["cargo"].lower() for keyword in position_lower.split()):
                    filtered_jobs.append(job)
            
            return filtered_jobs[:10]  # Retornar até 10 vagas
            
        except Exception as e:
            print(f"❌ Error loading fallback data: {e}")
            return []
    
    def save_to_cache(self, position: str, jobs: List[Dict]):
        """Salva jobs no cache"""
        try:
            cache_data = self.load_cache()
            cache_data[position] = {
                "jobs": jobs,
                "timestamp": datetime.now().isoformat()
            }
            
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
                
            print(f"💾 Cached {len(jobs)} jobs for '{position}'")
            
        except Exception as e:
            print(f"❌ Error saving cache: {e}")
    
    def load_cache(self) -> Dict:
        """Carrega dados do cache"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"❌ Error loading cache: {e}")
        
        return {}
    
    def get_cached_jobs(self, position: str) -> Optional[List[Dict]]:
        """Busca jobs do cache se ainda válidos"""
        try:
            cache_data = self.load_cache()
            
            if position in cache_data:
                cache_entry = cache_data[position]
                timestamp = datetime.fromisoformat(cache_entry["timestamp"])
                
                if datetime.now() - timestamp < self.cache_duration:
                    print(f"📋 Using cached data for '{position}'")
                    return cache_entry["jobs"]
                else:
                    print(f"⏰ Cache expired for '{position}'")
                    
        except Exception as e:
            print(f"❌ Error checking cache: {e}")
        
        return None
    
    async def update_cache(self):
        """Atualiza cache para todas as posições"""
        try:
            cache_data = self.load_cache()
            positions = list(cache_data.keys())
            
            for position in positions:
                print(f"🔄 Updating cache for: {position}")
                jobs = await self.scrape_jobs(position=position, limit=20)
                self.save_to_cache(position, jobs)
                
        except Exception as e:
            print(f"❌ Error updating cache: {e}")
    
    def __del__(self):
        """Cleanup do driver"""
        if self.driver:
            self.driver.quit()

