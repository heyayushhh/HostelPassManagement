import {
  users, User, InsertUser,
  passes, Pass, InsertPass,
  notifications, Notification, InsertNotification,
  passStatusEnum
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private passes: Map<number, Pass>;
  private notifications: Map<number, Notification>;
  
  private userCurrentId: number;
  private passCurrentId: number;
  private notificationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.passes = new Map();
    this.notifications = new Map();
    
    this.userCurrentId = 1;
    this.passCurrentId = 1;
    this.notificationCurrentId = 1;
    
    // Create default warden and guard accounts
    this.createUser({
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
    
    this.createUser({
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
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Pass methods
  async createPass(userId: number, insertPass: InsertPass): Promise<Pass> {
    const id = this.passCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const pass: Pass = {
      ...insertPass,
      id,
      userId,
      status: 'pending',
      wardenId: null,
      wardenNote: null,
      createdAt,
      updatedAt
    };
    this.passes.set(id, pass);
    return pass;
  }
  
  async getPassById(passId: number): Promise<Pass | undefined> {
    return this.passes.get(passId);
  }
  
  async getPassesByUserId(userId: number): Promise<Pass[]> {
    return Array.from(this.passes.values()).filter(
      (pass) => pass.userId === userId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }
  
  async getPassesByStatus(status: string): Promise<Pass[]> {
    return Array.from(this.passes.values()).filter(
      (pass) => pass.status === status
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }
  
  async getPassesByStatusAndDate(status: string, date: string): Promise<Pass[]> {
    return Array.from(this.passes.values()).filter(
      (pass) => pass.status === status && pass.date === date
    ).sort((a, b) => {
      // Compare time slots (assuming format like "9:00 - 10:00")
      const aStartTime = pass.timeSlot.split(' - ')[0];
      const bStartTime = pass.timeSlot.split(' - ')[0];
      return aStartTime.localeCompare(bStartTime);
    });
  }
  
  async updatePassStatus(
    passId: number, 
    status: string, 
    wardenId: number,
    wardenNote?: string
  ): Promise<Pass> {
    const pass = this.passes.get(passId);
    
    if (!pass) {
      throw new Error(`Pass with ID ${passId} not found`);
    }
    
    const updatedPass: Pass = {
      ...pass,
      status: status as typeof passStatusEnum.enumValues[number],
      wardenId,
      wardenNote: wardenNote || null,
      updatedAt: new Date()
    };
    
    this.passes.set(passId, updatedPass);
    return updatedPass;
  }
  
  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const createdAt = new Date();
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }
  
  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const notification = this.notifications.get(notificationId);
    
    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }
    
    const updatedNotification: Notification = {
      ...notification,
      isRead: true
    };
    
    this.notifications.set(notificationId, updatedNotification);
    return updatedNotification;
  }
}

export const storage = new MemStorage();
