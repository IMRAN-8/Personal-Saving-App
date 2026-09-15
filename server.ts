import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { adminAuth } from "./src/lib/firebase-admin.ts";
import { DecodedIdToken } from "firebase-admin/auth";
import { db } from "./src/db/index.ts";
import { users, entries } from "./src/db/schema.ts";
import { eq, desc, and, gte } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Register or ensure user exists
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      
      const result = await db.insert(users)
        .values({
          uid,
          email: email || '',
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: { email: email || '' },
        })
        .returning();

      res.json(result[0]);
    } catch (error: any) {
      console.error("Failed to sync user:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });

  // Get user balance and dashboard data
  app.get("/api/dashboard", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.uid, req.user!.uid)
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const allEntries = await db.select().from(entries).where(eq(entries.userId, user.id)).orderBy(desc(entries.date));
      
      let balance = 0;
      let totalEarning = 0;
      let totalExpense = 0;

      allEntries.forEach(entry => {
        const amount = Number(entry.amount);
        if (entry.type === 'earning') {
          balance += amount;
          totalEarning += amount;
        } else {
          balance -= amount;
          totalExpense += amount;
        }
      });

      res.json({ balance, totalEarning, totalExpense, entries: allEntries });
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      res.status(500).json({ error: error.message || "Failed to fetch dashboard data" });
    }
  });

  // Get chart data (last 3 months)
  app.get("/api/chart", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.uid, req.user!.uid)
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      // PostgreSQL handles date strings format YYYY-MM-DD comparisons
      const formattedDate = threeMonthsAgo.toISOString().split('T')[0];

      const chartEntries = await db.select()
        .from(entries)
        .where(
          and(
            eq(entries.userId, user.id),
            gte(entries.date, formattedDate)
          )
        )
        .orderBy(entries.date);

      res.json(chartEntries);
    } catch (error: any) {
      console.error("Failed to fetch chart data:", error);
      res.status(500).json({ error: error.message || "Failed to fetch chart data" });
    }
  });

  // Add transaction
  app.post("/api/entries", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.uid, req.user!.uid)
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const { amount, type, note, date } = req.body;
      if (!amount || !type || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await db.insert(entries).values({
        userId: user.id,
        amount: amount.toString(),
        type,
        note: note || '',
        date,
      }).returning();

      res.json(result[0]);
    } catch (error: any) {
      console.error("Failed to add entry:", error);
      res.status(500).json({ error: error.message || "Failed to add entry" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
