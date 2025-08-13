import axios from 'axios';
import { loadVagas } from '../data/dataLoader.js';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

class JobDataService {
    constructor() {
        this.apiClient = axios.create({
            baseURL: PYTHON_API_URL,
            timeout: 30000, // 30 segundos timeout
        });
    }

    async checkPythonAPIHealth() {
        try {
            const response = await this.apiClient.get('/health');
            return response.status === 200;
        } catch (error) {
            console.log('❌ Python API not available:', error.message);
            return false;
        }
    }

    async getJobsFromPythonAPI(position, limit = 20) {
        try {
            console.log(`🔍 Fetching jobs from Python API for: ${position}`);
            
            const response = await this.apiClient.post('/scrape-jobs', {
                position: position,
                location: 'Brasil',
                limit: limit
            });

            console.log(`✅ Python API returned ${response.data.length} jobs`);
            return response.data;
            
        } catch (error) {
            console.error('❌ Error fetching from Python API:', error.message);
            throw error;
        }
    }

    async getJobsWithFallback(position, limit = 20) {
        try {
            // Primeiro tenta a API Python
            const isPythonAPIAvailable = await this.checkPythonAPIHealth();
            
            if (isPythonAPIAvailable) {
                try {
                    const jobs = await this.getJobsFromPythonAPI(position, limit);
                    return {
                        source: 'python_api',
                        jobs: jobs,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    console.log('⚠️ Python API failed, falling back to static data');
                }
            }

            // Fallback para dados estáticos
            console.log('📋 Using static data as fallback');
            const staticJobs = await loadVagas();
            
            // Filtrar por posição similar
            const filteredJobs = this.filterJobsByPosition(staticJobs, position);
            
            return {
                source: 'static_data',
                jobs: filteredJobs.slice(0, limit),
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error in getJobsWithFallback:', error);
            throw error;
        }
    }

    filterJobsByPosition(jobs, position) {
        const positionLower = position.toLowerCase();
        const keywords = positionLower.split(' ');
        
        return jobs.filter(job => {
            const jobTitle = job.cargo.toLowerCase();
            return keywords.some(keyword => jobTitle.includes(keyword));
        });
    }

    async updateJobCache() {
        try {
            console.log('🔄 Updating job cache via Python API');
            const response = await this.apiClient.post('/update-cache');
            console.log('✅ Cache updated successfully');
            return response.data;
        } catch (error) {
            console.error('❌ Error updating cache:', error.message);
            throw error;
        }
    }

    // Método para compatibilidade com o código existente
    async loadVagas() {
        const result = await this.getJobsWithFallback('', 50);
        return result.jobs;
    }
}

export const jobDataService = new JobDataService();

