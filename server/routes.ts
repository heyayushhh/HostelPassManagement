import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { 
  insertUserSchema, 
  loginSchema, 
  insertPassSchema, 
  passReviewSchema,
  users as usersTable
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Configure session middleware
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "gate-pass-secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  
  // Initialize passport and session
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  
  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      next();
    };
  };
  
  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    try {
      const { role } = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info.message || "Login failed" });
        }
        
        if (user.role !== role) {
          return res.status(403).json({ message: `Not authorized as a ${role}` });
        }
        
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          return res.json({ user: userWithoutPassword });
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });
  
  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    const user = req.user as any;
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Pass routes
  // Create a new pass request
  app.post("/api/passes", isAuthenticated, hasRole(["student"]), async (req, res) => {
    try {
      const passData = insertPassSchema.parse(req.body);
      const user = req.user as any;
      
      // Check if the student already has a pending or approved pass for the same date and time slot
      const userPasses = await storage.getPassesByUserId(user.id);
      const existingPass = userPasses.find(pass => 
        pass.date === passData.date && 
        pass.timeSlot === passData.timeSlot && 
        (pass.status === 'pending' || pass.status === 'approved')
      );
      
      if (existingPass) {
        return res.status(400).json({ 
          message: "You already have a pass request for this date and time slot. Please select a different time slot." 
        });
      }
      
      const pass = await storage.createPass(user.id, passData);
      
      // Create notification for wardens - get users with warden role
      // We need this async method to get all wardens since we don't have a direct function to get all wardens
      const wardenUsers = await db.select().from(usersTable).where(eq(usersTable.role, 'warden'));
      
      for (const warden of wardenUsers) {
        await storage.createNotification({
          userId: warden.id,
          message: `New gate pass request from ${user.name}`,
        });
      }
      
      res.status(201).json({ pass });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });
  
  // Get all passes for the current student
  app.get("/api/passes", isAuthenticated, hasRole(["student"]), async (req, res) => {
    const user = req.user as any;
    const passes = await storage.getPassesByUserId(user.id);
    
    res.json({ passes });
  });
  
  // Get pending passes for warden
  app.get("/api/passes/pending", isAuthenticated, hasRole(["warden"]), async (req, res) => {
    const pendingPasses = await storage.getPassesByStatus("pending");
    
    // Get students for each pass
    const passesWithStudents = await Promise.all(
      pendingPasses.map(async (pass) => {
        const student = await storage.getUser(pass.userId);
        return { ...pass, student };
      })
    );
    
    res.json({ passes: passesWithStudents });
  });
  
  // Get approved passes
  app.get("/api/passes/approved", isAuthenticated, hasRole(["warden", "guard"]), async (req, res) => {
    const date = req.query.date as string;
    
    let approvedPasses;
    if (date) {
      approvedPasses = await storage.getPassesByStatusAndDate("approved", date);
    } else {
      approvedPasses = await storage.getPassesByStatus("approved");
    }
    
    // Get students for each pass
    const passesWithStudents = await Promise.all(
      approvedPasses.map(async (pass) => {
        const student = await storage.getUser(pass.userId);
        return { ...pass, student };
      })
    );
    
    res.json({ passes: passesWithStudents });
  });
  
  // Get rejected passes
  app.get("/api/passes/rejected", isAuthenticated, hasRole(["warden"]), async (req, res) => {
    const rejectedPasses = await storage.getPassesByStatus("rejected");
    
    // Get students for each pass
    const passesWithStudents = await Promise.all(
      rejectedPasses.map(async (pass) => {
        const student = await storage.getUser(pass.userId);
        return { ...pass, student };
      })
    );
    
    res.json({ passes: passesWithStudents });
  });
  
  // Approve or reject a pass request
  app.post("/api/passes/review", isAuthenticated, hasRole(["warden"]), async (req, res) => {
    try {
      const reviewData = passReviewSchema.parse(req.body);
      const warden = req.user as any;
      
      const pass = await storage.getPassById(reviewData.passId);
      
      if (!pass) {
        return res.status(404).json({ message: "Pass not found" });
      }
      
      if (pass.status !== "pending") {
        return res.status(400).json({ message: "Pass is not in pending state" });
      }
      
      // Update pass status
      const updatedPass = await storage.updatePassStatus(
        reviewData.passId, 
        reviewData.status, 
        warden.id,
        reviewData.wardenNote
      );
      
      // Create notification for student
      const student = await storage.getUser(pass.userId);
      
      if (student) {
        const status = reviewData.status === "approved" ? "approved" : "rejected";
        await storage.createNotification({
          userId: student.id,
          message: `Your gate pass request for ${pass.date} (${pass.timeSlot}) has been ${status}`,
        });
      }
      
      res.json({ pass: updatedPass });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });
  
  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const notifications = await storage.getNotificationsByUserId(user.id);
    
    res.json({ notifications });
  });
  
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await storage.markNotificationAsRead(notificationId);
      
      res.json({ notification });
    } catch (error) {
      res.status(400).json({ message: "Invalid notification ID" });
    }
  });
  
  return httpServer;
}
