# Instalação via Docker na VPS

## Pré-requisitos
- Docker instalado na VPS
- Porta 3000 liberada no firewall

## Passos de instalação

1. Clone este repositório:
```bash
git clone https://github.com/dan15d2b/GraficaCRM.git
cd GraficaCRM
```

2. Copie `.env.example` para `.env.local` e configure:
```bash
cp .env.example .env.local
# Editar .env.local com suas variáveis
```

3. Build e start com Docker:
```bash
docker build -t crmgrafica .
docker run -d -p 3000:3000 --name crmgrafica_container -v $(pwd)/data:/app/data crmgrafica
```

## Variáveis de ambiente necessárias
- DATABASE_URL="file:/app/data/app.db"
- JWT_SECRET="sua_chave_secreta"
- NEXT_PUBLIC_APP_URL="https://crmadmin.duckdns.org"

## Alternativa com docker-compose
```bash
docker-compose up -d
```