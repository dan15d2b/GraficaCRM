#!/bin/bash
# Script para configurar o banco de dados

echo "🔧 Configurando banco de dados..."

# Criar banco se não existir
psql -U postgres -c "CREATE DATABASE crmgrafica;" 2>/dev/null || echo "Banco já existe"

# Aplicar migrations
echo "📋 Aplicando migrations..."
psql -U postgres -d crmgrafica -f supabase/migrations/0001_initial_schema.sql

echo "✅ Banco configurado!"
