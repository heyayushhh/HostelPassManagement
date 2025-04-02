import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Role Enum
export const userRoleEnum = pgEnum('user_role', ['student', 'warden', 'guard']);

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  name: text("name").notNull(),
  profilePhoto: text("profile_photo"),
  roomNo: text("room_no"),
  course: text("course"),
  batch: text("batch"),
  phoneNo: text("phone_no"),
  parentPhoneNo: text("parent_phone_no"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    phoneNo: z.string().min(10, "Phone number must be at least 10 digits").max(10, "Phone number must be exactly 10 digits"),
    parentPhoneNo: z.string().min(10, "Parent phone number must be at least 10 digits").max(10, "Parent phone number must be exactly 10 digits")
  });

// Pass Status Enum
export const passStatusEnum = pgEnum('pass_status', ['pending', 'approved', 'rejected']);

// Gate Pass Schema
export const passes = pgTable("passes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  outDate: text("out_date").notNull(),
  outTime: text("out_time").notNull(),
  inDate: text("in_date").notNull(),
  inTime: text("in_time").notNull(),
  reason: text("reason").notNull(),
  destination: text("destination").notNull(),
  contactNumber: text("contact_number").notNull(),
  parentContactNo: text("parent_contact_no").notNull(),
  status: passStatusEnum("status").notNull().default('pending'),
  wardenId: integer("warden_id").references(() => users.id),
  wardenNote: text("warden_note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPassSchema = createInsertSchema(passes)
  .omit({
    id: true,
    userId: true,
    status: true,
    wardenId: true,
    wardenNote: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    contactNumber: z.string().min(10, "Contact number must be at least 10 digits").max(10, "Contact number must be exactly 10 digits"),
    parentContactNo: z.string().min(10, "Parent contact number must be at least 10 digits").max(10, "Parent contact number must be exactly 10 digits")
  });

// Pass Review Schema for approval/rejection
export const passReviewSchema = z.object({
  passId: z.number(),
  status: z.enum(['approved', 'rejected']),
  wardenNote: z.string().optional(),
});

// Notification Schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Pass = typeof passes.$inferSelect;
export type InsertPass = z.infer<typeof insertPassSchema>;
export type PassReview = z.infer<typeof passReviewSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(['student', 'warden', 'guard']),
});

export type LoginData = z.infer<typeof loginSchema>;
