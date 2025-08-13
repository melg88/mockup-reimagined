#!/usr/bin/env python3
"""
Script de inicialização da API Python do ImpulsAI
"""

import uvicorn
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

if __name__ == "__main__":
    print("🚀 Iniciando ImpulsAI Python API...")
    print("📍 Porta: 5000")
    print("🌐 URL: http://localhost:5000")
    print("📚 Docs: http://localhost:5000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info"
    )

