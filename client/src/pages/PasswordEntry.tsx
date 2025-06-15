import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Import our wolf SVG
import fenrirWolfSvg from "../assets/fenrir-wolf.svg";

// Define schema with password and name
const formSchema = z.object({
  password: z.string().min(1, "Password is required"),
  name: z.string().min(1, "Name is required"),
});

export default function PasswordEntry() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [forgotPassword, setForgotPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      // Use the user's provided name for chat
      const userData = {
        username: values.name,
        password: values.password
      };
      
      const response = await apiRequest("POST", "/api/rooms/join", userData);
      const data = await response.json();
      
      // Store user details in session storage for later use
      sessionStorage.setItem("chatUsername", userData.username);
      sessionStorage.setItem("chatRoomPassword", values.password);
      
      // Navigate to chat room
      navigate(`/chat/${data.roomId}`);
      
      toast({
        title: "Hall access granted",
        description: `Welcome to the Hall of Fenrir, ${userData.username}!`,
      });
    } catch (error) {
      toast({
        title: "Entry denied",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleForgotPassword = () => {
    setForgotPassword(true);
    setTimeout(() => {
      setForgotPassword(false);
      toast({
        title: "Access hint",
        description: "Create a new password to establish your own hall",
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0A1A2F] via-[#162A47] to-[#0F1E33] flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all">
        {/* Wolf hero image area */}
        <div className="relative h-72 bg-gradient-to-r from-[#533FE2] to-[#7B61FF] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={fenrirWolfSvg} alt="Fenrir Wolf" className="w-56 h-56 transform scale-110" />
          </div>
          
          {/* Norse-style decorative elements */}
          <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white/40 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-white/30 rounded-full"></div>
          <div className="absolute top-6 right-10 w-4 h-4 bg-white/20 rounded-full"></div>
        </div>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Your Name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7B61FF] focus:border-transparent transition-all shadow-sm text-gray-700"
                        {...field}
                      />
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
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter Random 6 digit password to enter hall"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7B61FF] focus:border-transparent transition-all shadow-sm text-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-sm text-gray-500 hover:text-[#7B61FF] transition-colors"
                >
                  {forgotPassword ? "Checking..." : "Forgot Password?"}
                </button>
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#533FE2] to-[#7B61FF] hover:from-[#4835C4] hover:to-[#6A52E5] text-white font-medium py-6 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 h-12"
              >
                <span className="text-base uppercase tracking-wide">Enter Hall</span>
              </Button>
            </form>
          </Form>
          
          {/* Bottom decorative element */}
          <div className="mt-6 flex justify-center">
            <svg width="40" height="40" viewBox="0 0 100 100" className="text-gray-200">
              <path fill="currentColor" d="M50,10 L90,50 L50,90 L10,50 Z M50,30 L70,50 L50,70 L30,50 Z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
