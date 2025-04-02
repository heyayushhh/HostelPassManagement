import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extend schema for validation
const extendedUserSchema = insertUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof extendedUserSchema>;

export default function Register() {
  const { register, isLoading, error } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(extendedUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "student", // Only students can register
      roomNo: "",
      course: "",
      batch: "",
      phoneNo: "",
      parentPhoneNo: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    // Remove confirmPassword field as it's not in the backend schema
    const { confirmPassword, ...userData } = data;
    
    try {
      await register(userData as InsertUser);
      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials",
      });
      navigate("/");
    } catch (error) {
      // Error handling is done in the auth context
    }
  }

  return (
    <div className="min-h-screen py-8 flex items-center justify-center bg-gradient-to-b from-primary-light/20 to-gray-100">
      <Card className="max-w-md w-full shadow-lg border-0">
        <div className="bg-primary text-white px-6 py-5 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium bg-gradient-to-r from-white to-gray-200 text-transparent bg-clip-text">Campus Gate Pass System</h1>
            <Link href="/">
              <a className="text-sm bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-md">Login Instead</a>
            </Link>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 mr-2 text-primary"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-medium text-gray-800">Student Registration</h2>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="roomNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room No.</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Room number" 
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 2022-26" 
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your course" 
                        name={field.name}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your phone number" 
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentPhoneNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent's Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Parent's phone number" 
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white py-6 mt-2 transition-colors font-medium text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link href="/">
                  <a className="text-primary hover:underline">Login now</a>
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
