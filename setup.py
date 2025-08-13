#!/usr/bin/env python3
"""
Script de setup completo para o ImpulsAI
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None):
    """Executa um comando e retorna o resultado"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {command}")
            return True
        else:
            print(f"❌ {command}")
            print(f"Erro: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Erro executando {command}: {e}")
        return False

def check_python_version():
    """Verifica se a versão do Python é compatível"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ é necessário")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def setup_node_dependencies():
    """Instala dependências do Node.js"""
    print("\n📦 Instalando dependências Node.js...")
    return run_command("npm install")

def setup_python_dependencies():
    """Instala dependências Python"""
    print("\n🐍 Instalando dependências Python...")
    api_dir = Path("api")
    if not api_dir.exists():
        print("❌ Diretório 'api' não encontrado")
        return False
    
    return run_command("pip install -r requirements.txt", cwd="api")

def create_env_file():
    """Cria arquivo .env se não existir"""
    print("\n🔧 Configurando variáveis de ambiente...")
    env_file = Path("api/.env")
    env_example = Path("api/env.example")
    
    if not env_file.exists() and env_example.exists():
        run_command("cp env.example .env", cwd="api")
        print("✅ Arquivo .env criado (edite com suas credenciais)")
    else:
        print("ℹ️ Arquivo .env já existe ou exemplo não encontrado")

def main():
    """Função principal de setup"""
    print("🚀 Setup do ImpulsAI")
    print("=" * 50)
    
    # Verificar Python
    if not check_python_version():
        sys.exit(1)
    
    # Instalar dependências Node.js
    if not setup_node_dependencies():
        print("❌ Falha ao instalar dependências Node.js")
        sys.exit(1)
    
    # Instalar dependências Python
    if not setup_python_dependencies():
        print("❌ Falha ao instalar dependências Python")
        sys.exit(1)
    
    # Configurar .env
    create_env_file()
    
    print("\n🎉 Setup concluído!")
    print("\n📋 Próximos passos:")
    print("1. Edite api/.env com suas credenciais do LinkedIn (opcional)")
    print("2. Execute 'npm run dev:full' para iniciar todos os serviços")
    print("3. Acesse http://localhost:8080")
    print("\n🔧 Comandos úteis:")
    print("- npm run dev:full    # Inicia todos os serviços")
    print("- npm run server      # Apenas servidor Node.js")
    print("- npm run api:python  # Apenas API Python")
    print("- npm run dev         # Apenas frontend")

if __name__ == "__main__":
    main()

