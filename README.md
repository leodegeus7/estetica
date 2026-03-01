# Dr. Murilo do Valle — Sistema de Gestão Clínica

## Stack
- **Frontend:** React + Vite
- **Banco de dados:** Supabase (PostgreSQL)
- **Hospedagem:** Cloudflare Pages

---

## ✅ Setup em 5 passos

### 1. Supabase — Banco de dados

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e cole todo o conteúdo de `schema.sql` e execute
3. Vá em **Authentication → Users → Add user** e crie:
   - `murillodovalle@gmail.com` / `12345`
   - `leonardodegeus@gmail.com` / `12345`
4. Copie em **Project Settings → API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

---

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

### 3. Instalar e rodar local

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`

---

### 4. GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/SEU_USUARIO/clinica-murilo.git
git push -u origin main
```

---

### 5. Cloudflare Pages

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Create a project → Connect to Git** → selecione o repositório
3. Configure o build:

| Campo            | Valor         |
|-----------------|---------------|
| Framework        | Vite          |
| Build command    | `npm run build` |
| Build output     | `dist`        |
| Node version     | `18`          |

4. Em **Environment variables**, adicione:
   ```
   VITE_SUPABASE_URL      = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   ```
5. Clique **Save and Deploy** ✅

---

## 🔄 Atualizações futuras

```bash
# Após editar qualquer arquivo:
git add .
git commit -m "descrição da mudança"
git push
# O Cloudflare re-deploya automaticamente em ~1 minuto
```

---

## 📁 Estrutura do projeto

```
clinica-murilo/
├── src/
│   ├── App.jsx        ← toda a interface e lógica
│   ├── db.js          ← todas as operações com o Supabase
│   ├── supabase.js    ← configuração do cliente Supabase
│   └── main.jsx       ← entry point React
├── schema.sql         ← script SQL para criar as tabelas
├── .env.example       ← template das variáveis de ambiente
├── .env.local         ← suas credenciais (NÃO sobe pro git)
├── index.html
├── vite.config.js
└── package.json
```

---

## 💰 Custos

| Serviço | Plano gratuito |
|---------|----------------|
| Supabase | 500MB banco, 50k usuários |
| Cloudflare Pages | Ilimitado |

**Para uma clínica pequena: gratuito para sempre.**
