import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PassDetailsModal from "@/components/shared/PassDetailsModal";
import ProfilePhotoUpload from "@/components/shared/ProfilePhotoUpload";
import { School, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPassSchema, InsertPass, Pass } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// No longer using TIME_OPTIONS array
// Now using explicit time slot options in 12-hour format with AM/PM

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  
  // Form for new pass request
  const form = useForm<InsertPass>({
    resolver: zodResolver(insertPassSchema),
    defaultValues: {
      outDate: format(new Date(), "yyyy-MM-dd"),
      outTime: "",
      inDate: format(new Date(), "yyyy-MM-dd"),
      inTime: "",
      reason: "",
      destination: "",
      contactNumber: user?.phoneNo || "",
      parentContactNo: user?.parentPhoneNo || "",
    },
  });

  // Fetch pass history
  const { data: passHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/passes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/passes");
      const data = await res.json();
      return data.passes as Pass[];
    },
  });
  
  // Create new pass request
  const createPassMutation = useMutation({
    mutationFn: async (data: InsertPass) => {
      const res = await apiRequest("POST", "/api/passes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
      form.reset({
        outDate: format(new Date(), "yyyy-MM-dd"),
        outTime: "",
        inDate: format(new Date(), "yyyy-MM-dd"),
        inTime: "",
        reason: "",
        destination: "",
        contactNumber: user?.phoneNo || "",
        parentContactNo: user?.parentPhoneNo || "",
      });
      toast({
        title: "Request Submitted",
        description: "Your gate pass request has been submitted successfully and is pending approval.",
      });
    },
  });

  const onSubmit = (data: InsertPass) => {
    // Check if student has a pending or approved pass for the same date and time
    const existingPass = passHistory?.find(pass => 
      pass.outDate === data.outDate && 
      pass.outTime === data.outTime && 
      (pass.status === 'pending' || pass.status === 'approved')
    );
    
    if (existingPass) {
      toast({
        title: "Request Failed",
        description: "You already have a pass request for this date and time. Please select a different time.",
        variant: "destructive"
      });
      return;
    }
    
    createPassMutation.mutate(data);
  };

  // Filter passes based on history filter
  const filteredPasses = passHistory?.filter((pass) => {
    if (historyFilter === "all") return true;
    return pass.status === historyFilter;
  });

  const handleViewPass = (pass: Pass) => {
    setSelectedPass(pass);
    setModalOpen(true);
  };

  return (
    <DashboardLayout title="Gate Pass System" icon={<School className="h-6 w-6" />}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              {/* Profile Photo Upload Component */}
              <div className="flex flex-col items-center mb-6">
                {user && <ProfilePhotoUpload user={user} />}
              </div>
              
              <div className="flex flex-col items-center space-y-2 mb-4">
                <h2 className="text-lg font-medium">{user?.name}</h2>
                <p className="text-gray-600 text-sm">@{user?.username}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Room No:</span>
                    <span className="text-gray-800 text-sm font-medium">
                      {user?.roomNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Course:</span>
                    <span className="text-gray-800 text-sm font-medium">
                      {user?.course}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Batch:</span>
                    <span className="text-gray-800 text-sm font-medium">
                      {user?.batch}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Phone:</span>
                    <span className="text-gray-800 text-sm font-medium">
                      {user?.phoneNo}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: New Pass Request & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Pass Request Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Create New Gate Pass</h2>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Out Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="outDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Out Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="outTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Out Time</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select out time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="12:00 AM - 1:00 AM">12:00 AM - 1:00 AM</SelectItem>
                                <SelectItem value="1:00 AM - 2:00 AM">1:00 AM - 2:00 AM</SelectItem>
                                <SelectItem value="2:00 AM - 3:00 AM">2:00 AM - 3:00 AM</SelectItem>
                                <SelectItem value="3:00 AM - 4:00 AM">3:00 AM - 4:00 AM</SelectItem>
                                <SelectItem value="4:00 AM - 5:00 AM">4:00 AM - 5:00 AM</SelectItem>
                                <SelectItem value="5:00 AM - 6:00 AM">5:00 AM - 6:00 AM</SelectItem>
                                <SelectItem value="6:00 AM - 7:00 AM">6:00 AM - 7:00 AM</SelectItem>
                                <SelectItem value="7:00 AM - 8:00 AM">7:00 AM - 8:00 AM</SelectItem>
                                <SelectItem value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM</SelectItem>
                                <SelectItem value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</SelectItem>
                                <SelectItem value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</SelectItem>
                                <SelectItem value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</SelectItem>
                                <SelectItem value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</SelectItem>
                                <SelectItem value="1:00 PM - 2:00 PM">1:00 PM - 2:00 PM</SelectItem>
                                <SelectItem value="2:00 PM - 3:00 PM">2:00 PM - 3:00 PM</SelectItem>
                                <SelectItem value="3:00 PM - 4:00 PM">3:00 PM - 4:00 PM</SelectItem>
                                <SelectItem value="4:00 PM - 5:00 PM">4:00 PM - 5:00 PM</SelectItem>
                                <SelectItem value="5:00 PM - 6:00 PM">5:00 PM - 6:00 PM</SelectItem>
                                <SelectItem value="6:00 PM - 7:00 PM">6:00 PM - 7:00 PM</SelectItem>
                                <SelectItem value="7:00 PM - 8:00 PM">7:00 PM - 8:00 PM</SelectItem>
                                <SelectItem value="8:00 PM - 9:00 PM">8:00 PM - 9:00 PM</SelectItem>
                                <SelectItem value="9:00 PM - 10:00 PM">9:00 PM - 10:00 PM</SelectItem>
                                <SelectItem value="10:00 PM - 11:00 PM">10:00 PM - 11:00 PM</SelectItem>
                                <SelectItem value="11:00 PM - 12:00 AM">11:00 PM - 12:00 AM</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* In Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="inDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>In Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>In Time</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select in time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="12:00 AM - 1:00 AM">12:00 AM - 1:00 AM</SelectItem>
                                <SelectItem value="1:00 AM - 2:00 AM">1:00 AM - 2:00 AM</SelectItem>
                                <SelectItem value="2:00 AM - 3:00 AM">2:00 AM - 3:00 AM</SelectItem>
                                <SelectItem value="3:00 AM - 4:00 AM">3:00 AM - 4:00 AM</SelectItem>
                                <SelectItem value="4:00 AM - 5:00 AM">4:00 AM - 5:00 AM</SelectItem>
                                <SelectItem value="5:00 AM - 6:00 AM">5:00 AM - 6:00 AM</SelectItem>
                                <SelectItem value="6:00 AM - 7:00 AM">6:00 AM - 7:00 AM</SelectItem>
                                <SelectItem value="7:00 AM - 8:00 AM">7:00 AM - 8:00 AM</SelectItem>
                                <SelectItem value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM</SelectItem>
                                <SelectItem value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</SelectItem>
                                <SelectItem value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</SelectItem>
                                <SelectItem value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</SelectItem>
                                <SelectItem value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</SelectItem>
                                <SelectItem value="1:00 PM - 2:00 PM">1:00 PM - 2:00 PM</SelectItem>
                                <SelectItem value="2:00 PM - 3:00 PM">2:00 PM - 3:00 PM</SelectItem>
                                <SelectItem value="3:00 PM - 4:00 PM">3:00 PM - 4:00 PM</SelectItem>
                                <SelectItem value="4:00 PM - 5:00 PM">4:00 PM - 5:00 PM</SelectItem>
                                <SelectItem value="5:00 PM - 6:00 PM">5:00 PM - 6:00 PM</SelectItem>
                                <SelectItem value="6:00 PM - 7:00 PM">6:00 PM - 7:00 PM</SelectItem>
                                <SelectItem value="7:00 PM - 8:00 PM">7:00 PM - 8:00 PM</SelectItem>
                                <SelectItem value="8:00 PM - 9:00 PM">8:00 PM - 9:00 PM</SelectItem>
                                <SelectItem value="9:00 PM - 10:00 PM">9:00 PM - 10:00 PM</SelectItem>
                                <SelectItem value="10:00 PM - 11:00 PM">10:00 PM - 11:00 PM</SelectItem>
                                <SelectItem value="11:00 PM - 12:00 AM">11:00 PM - 12:00 AM</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Visit</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Why are you leaving the campus?"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Where are you going?"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Contact Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your contact number"
                              type="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parentContactNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent's Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your parent's contact number"
                              type="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="mt-6 w-full bg-primary text-white"
                    disabled={createPassMutation.isPending}
                  >
                    {createPassMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Pass History Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Your Pass History</h2>
                <div className="text-sm">
                  <Select
                    value={historyFilter}
                    onValueChange={setHistoryFilter}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Passes</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredPasses && filteredPasses.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Out Date
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Out Time
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          In Date
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPasses.map((pass) => (
                        <tr key={pass.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {pass.outDate}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {pass.outTime}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {pass.inDate}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              className={`px-3 py-1 text-sm font-medium rounded-full ${
                                pass.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : pass.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <Button
                              variant="link"
                              className="text-primary hover:text-primary-dark"
                              onClick={() => handleViewPass(pass)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No pass requests found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pass Details Modal */}
      {selectedPass && (
        <PassDetailsModal
          pass={selectedPass}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}