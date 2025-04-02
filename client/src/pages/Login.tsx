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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light/20 to-gray-100">
      <Card className="max-w-md w-full shadow-lg border-0">
        <div className="bg-primary text-white px-6 py-5 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium bg-gradient-to-r from-white to-gray-200 text-transparent bg-clip-text">Campus Gate Pass System</h1>
            <Link href="/register">
              <a className="text-sm bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-md">Register Now</a>
            </Link>
          </div>
        </div>
        
        <CardContent className="p-8">
          <h2 className="text-xl font-medium text-gray-800 mb-6">Welcome Back</h2>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-5">
                <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Login As</FormLabel>
                <div className="flex rounded-md shadow-md">
                  <Button
                    type="button"
                    onClick={() => handleRoleChange('student')}
                    className={`flex-1 rounded-l-md py-3 transition-all duration-200 ${
                      selectedRole === 'student' 
                        ? 'bg-primary text-white shadow-inner' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <School className="h-5 w-5 mr-2" />
                    Student
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRoleChange('warden')}
                    className={`flex-1 border-x border-gray-200 py-3 transition-all duration-200 ${
                      selectedRole === 'warden' 
                        ? 'bg-primary text-white shadow-inner' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Warden
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRoleChange('guard')}
                    className={`flex-1 rounded-r-md py-3 transition-all duration-200 ${
                      selectedRole === 'guard' 
                        ? 'bg-primary text-white shadow-inner' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Shield className="h-5 w-5 mr-2" />
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
                className="w-full bg-primary hover:bg-primary-dark text-white py-6 mt-2 transition-colors font-medium text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
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
