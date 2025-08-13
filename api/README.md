# ImpulsAI Python API

API Python para web scraping de vagas do LinkedIn, integrada ao sistema ImpulsAI.

## 🚀 Funcionalidades

- **Web Scraping**: Coleta vagas do LinkedIn em tempo real
- **Cache Inteligente**: Armazena dados por 6 horas para performance
- **Fallback**: Usa dados estáticos quando scraping falha
- **Extração de Competências**: Identifica skills automaticamente
- **API REST**: Endpoints para integração com Node.js

## 📋 Pré-requisitos

- Python 3.8+
- Chrome/Chromium browser
- ChromeDriver (instalado automaticamente)

## 🛠️ Instalação

1. **Instalar dependências:**
```bash
cd api
pip install -r requirements.txt
```

2. **Configurar variáveis de ambiente:**
```bash
cp env.example .env
# Editar .env com suas credenciais do LinkedIn (opcional)
```

3. **Instalar ChromeDriver:**
```bash
# O Selenium irá baixar automaticamente
```

## 🚀 Execução

### Desenvolvimento
```bash
python start.py
```

### Produção
```bash
uvicorn main:app --host 0.0.0.0 --port 5000
```

## 📚 Endpoints

### GET `/health`
Verifica se a API está funcionando.

### POST `/scrape-jobs`
Scrapes vagas do LinkedIn.

**Body:**
```json
{
  "position": "Desenvolvedor Full Stack",
  "location": "Brasil",
  "limit": 20
}
```

### GET `/jobs/{position}`
Busca vagas por posição (com cache).

### POST `/update-cache`
Força atualização do cache.

## 🔧 Configuração

### Variáveis de Ambiente

- `LINKEDIN_EMAIL`: Email do LinkedIn (opcional)
- `LINKEDIN_PASSWORD`: Senha do LinkedIn (opcional)
- `CACHE_DURATION_HOURS`: Duração do cache (padrão: 6)

### Credenciais do LinkedIn

**Opcional**: Se configuradas, permite acesso a mais dados.
**Sem credenciais**: Usa dados públicos disponíveis.

## 📊 Estrutura de Dados

### Resposta de Vaga
```json
{
  "cargo": "Desenvolvedor Full Stack",
  "empresa": "TechCorp",
  "localizacao": "São Paulo, SP",
  "competencias": ["JavaScript", "React", "Node.js"],
  "descricao": "Descrição da vaga..."
}
```

## 🔄 Integração com Node.js

A API Python se integra automaticamente com o Node.js através do `jobDataService.js`:

```javascript
import { jobDataService } from './services/jobDataService.js';

// Buscar vagas com fallback
const jobs = await jobDataService.getJobsWithFallback('Desenvolvedor', 20);
```

## 🐛 Troubleshooting

### Erro de ChromeDriver
```bash
# Instalar ChromeDriver manualmente
pip install webdriver-manager
```

### Erro de CORS
- Verificar se as origens estão configuradas em `main.py`

### Rate Limiting
- A API inclui delays automáticos
- Use cache para evitar muitas requisições

## 📈 Monitoramento

- Logs detalhados no console
- Métricas de cache hit/miss
- Status de scraping em tempo real

## 🔒 Segurança

- CORS configurado para origens específicas
- Timeout de 30 segundos nas requisições
- Validação de entrada com Pydantic
- Headless mode para scraping

