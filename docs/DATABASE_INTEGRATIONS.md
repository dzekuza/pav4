# Database Integration Guide

Your app now uses **SQLite + Prisma** for persistent data storage! Here are all the database options available:

## 🚀 **Current Setup: SQLite + Prisma** ✅

**What's included:**

- ✅ Persistent user accounts and authentication
- ✅ Search history storage (last 50 searches per user)
- ✅ Admin user management
- ✅ Database health monitoring
- ✅ Automatic backups (file-based)

**Database location:** `./prisma/dev.db`

---

## 🔄 **Alternative Database Options**

### **1. PostgreSQL (Production Ready)**

```bash
# Install PostgreSQL support
npm install pg @types/pg

# Update prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Update .env
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"
```

### **2. Neon Database (Serverless PostgreSQL)**

```bash
# Sign up at neon.tech and get connection string
# Update .env
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb"

# No code changes needed - just update the connection string!
```

### **3. PlanetScale (Serverless MySQL)**

```bash
# Update prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}

# Update .env with PlanetScale connection string
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/mydb"
```

### **4. Supabase (PostgreSQL + Real-time)**

```bash
# Sign up at supabase.com and create project
# Update .env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Optional: Add Supabase client for real-time features
npm install @supabase/supabase-js
```

### **5. MongoDB + Prisma**

```bash
# Update prisma/schema.prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

# Update .env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/mydb"
```

---

## 🛠️ **How to Switch Databases**

1. **Update the datasource** in `prisma/schema.prisma`
2. **Update DATABASE_URL** in `.env`
3. **Run migrations:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. **Restart the server**

---

## 📊 **Database Management Commands**

```bash
# View database in browser
npx prisma studio

# Reset database (⚠️ DELETES ALL DATA)
npx prisma db push --force-reset

# Create database backup (SQLite only)
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# Create admin user
node scripts/create-admin.js admin@example.com password123

# Check database health
curl http://localhost:8080/api/health
```

---

## 🔒 **Production Considerations**

### **For Production Deployment:**

1. **Use PostgreSQL or Neon** (not SQLite)
2. **Set strong JWT_SECRET** in environment variables
3. **Enable SSL** in production
4. **Set up regular backups**
5. **Monitor database performance**

### **Environment Variables for Production:**

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-super-secret-256-bit-key"
NODE_ENV="production"
```

---

## 📈 **Monitoring & Health Checks**

- **Health Check:** `GET /api/health`
- **Database Stats:** Included in health check response
- **Prisma Studio:** `npx prisma studio` (development only)

---

## 🚫 **What's No Longer In-Memory**

✅ **Now Persistent:**

- User accounts and passwords
- User search history (last 50 searches)
- Admin permissions
- Login sessions (via JWT cookies)

❌ **No More Data Loss:**

- Server restarts don't delete data
- Deployment updates preserve data
- Crash recovery maintains data integrity

---

## 🔧 **Quick Database Commands**

```bash
# Check if database is working
curl http://localhost:8080/api/health

# View all tables and data
npx prisma studio

# See database schema
npx prisma format

# Create first admin user
node scripts/create-admin.js admin@yourdomain.com securepassword123
```

Your app now has enterprise-grade data persistence! 🎉
