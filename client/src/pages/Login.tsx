import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, LoginData } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, School, Shield, User } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, isLoading, error } = useAuth();
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<'student' | 'warden' | 'guard'>('student');

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      role: selectedRole,
    },
  });

  async function onSubmit(data: LoginData) {
    try {
      await login({ ...data, role: selectedRole });
    } catch (error) {
      // Error handling is done in the auth context
    }
  }

  const handleRoleChange = (role: 'student' | 'warden' | 'guard') => {
    setSelectedRole(role);
    form.setValue("role", role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="max-w-md w-full">
        <div className="bg-primary text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium">Campus Gate Pass System</h1>
            <Link href="/register">
              <a className="text-sm cursor-pointer hover:underline">Register</a>
            </Link>
          </div>
        </div>
        
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Login to your account</h2>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-5">
                <FormLabel className="block text-sm font-medium text-gray-700 mb-1">User Type</FormLabel>
                <div className="flex rounded-md shadow-sm">
                  <Button
                    type="button"
                    onClick={() => handleRoleChange('student')}
                    className={`flex-1 rounded-l ${
                      selectedRole === 'student' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <School className="h-4 w-4 mr-2" />
                    Student
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRoleChange('warden')}
                    className={`flex-1 ${
                      selectedRole === 'warden' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Warden
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRoleChange('guard')}
                    className={`flex-1 rounded-r ${
                      selectedRole === 'guard' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Guard
                  </Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              
              {selectedRole === 'student' && (
                <p className="text-sm text-center text-gray-600 mt-4">
                  Don't have an account?{" "}
                  <Link href="/register">
                    <a className="text-primary hover:underline">Register now</a>
                  </Link>
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
