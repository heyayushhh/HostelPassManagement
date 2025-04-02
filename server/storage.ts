import {
  users, User, InsertUser,
  passes, Pass, InsertPass,
  notifications, Notification, InsertNotification,
  passStatusEnum
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfilePhoto(userId: number, photoPath: string): Promise<User>;
  
  // Pass methods
  createPass(userId: number, pass: InsertPass): Promise<Pass>;
  getPassById(passId: number): Promise<Pass | undefined>;
  getPassesByUserId(userId: number): Promise<Pass[]>;
  getPassesByStatus(status: string): Promise<Pass[]>;
  getPassesByStatusAndDate(status: string, date: string): Promise<Pass[]>;
  updatePassStatus(passId: number, status: string, wardenId: number, wardenNote?: string): Promise<Pass>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<Notification>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Create initial warden and guard users if they don't exist
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    try {
      // Check if warden exists
      const wardenExists = await this.getUserByUsername('warden');
      if (!wardenExists) {
        await this.createUser({
          username: 'warden',
          password: 'warden123',
          role: 'warden',
          name: 'Dr. Smith (Warden)',
          roomNo: '',
          course: '',
          batch: '',
          phoneNo: '',
          parentPhoneNo: ''
        });
        console.log('Created default warden account');
      }

      // Check if guard exists
      const guardExists = await this.getUserByUsername('guard');
      if (!guardExists) {
        await this.createUser({
          username: 'guard',
          password: 'guard123',
          role: 'guard',
          name: 'Security Officer',
          roomNo: '',
          course: '',
          batch: '',
          phoneNo: '',
          parentPhoneNo: ''
        });
        console.log('Created default guard account');
      }
    } catch (error) {
      console.error('Error initializing default users:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserProfilePhoto(userId: number, photoPath: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ profilePhoto: photoPath })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }
  
  // Pass methods
  async createPass(userId: number, insertPass: InsertPass): Promise<Pass> {
    const now = new Date();
    const [pass] = await db
      .insert(passes)
      .values({
        ...insertPass,
        userId,
        status: 'pending',
        wardenId: null,
        wardenNote: null,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return pass;
  }
  
  async getPassById(passId: number): Promise<Pass | undefined> {
    const [pass] = await db.select().from(passes).where(eq(passes.id, passId));
    return pass;
  }
  
  async getPassesByUserId(userId: number): Promise<Pass[]> {
    return await db
      .select()
      .from(passes)
      .where(eq(passes.userId, userId))
      .orderBy(desc(passes.createdAt)); // Newest first
  }
  
  async getPassesByStatus(status: string): Promise<Pass[]> {
    // Convert string to enum value
    const statusValue = status as typeof passStatusEnum.enumValues[number];
    return await db
      .select()
      .from(passes)
      .where(eq(passes.status, statusValue))
      .orderBy(desc(passes.createdAt)); // Newest first
  }
  
  async getPassesByStatusAndDate(status: string, date: string): Promise<Pass[]> {
    // Convert string to enum value
    const statusValue = status as typeof passStatusEnum.enumValues[number];
    return await db
      .select()
      .from(passes)
      .where(and(eq(passes.status, statusValue), eq(passes.outDate, date)))
      .orderBy(passes.outTime); // Order by time
  }
  
  async updatePassStatus(
    passId: number, 
    status: string, 
    wardenId: number,
    wardenNote?: string
  ): Promise<Pass> {
    const [updatedPass] = await db
      .update(passes)
      .set({
        status: status as typeof passStatusEnum.enumValues[number],
        wardenId,
        wardenNote: wardenNote || null,
        updatedAt: new Date()
      })
      .where(eq(passes.id, passId))
      .returning();
    
    if (!updatedPass) {
      throw new Error(`Pass with ID ${passId} not found`);
    }
    
    return updatedPass;
  }
  
  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...insertNotification,
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    return notification;
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt)); // Newest first
  }
  
  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    
    if (!updatedNotification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }
    
    return updatedNotification;
  }
}

export const storage = new DatabaseStorage();
