import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PassDetailsModal from "@/components/shared/PassDetailsModal";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pass, PassReview, User as UserType } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, CheckCircle, XCircle } from "lucide-react";

export default function WardenDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPass, setSelectedPass] = useState<(Pass & { student?: UserType }) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [passToReview, setPassToReview] = useState<Pass | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch pending pass requests
  const { data: pendingPasses, isLoading: isLoadingPending } = useQuery({
    queryKey: ["/api/passes/pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/passes/pending");
      const data = await res.json();
      return data.passes as (Pass & { student: UserType })[];
    },
    enabled: activeTab === "pending",
  });

  // Fetch approved pass requests
  const { data: approvedPasses, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["/api/passes/approved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/passes/approved");
      const data = await res.json();
      return data.passes as (Pass & { student: UserType })[];
    },
    enabled: activeTab === "approved",
  });

  // Fetch rejected pass requests
  const { data: rejectedPasses, isLoading: isLoadingRejected } = useQuery({
    queryKey: ["/api/passes/rejected"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/passes/rejected");
      const data = await res.json();
      return data.passes as (Pass & { student: UserType })[];
    },
    enabled: activeTab === "rejected",
  });

  // Review pass mutation
  const reviewPassMutation = useMutation({
    mutationFn: async (data: PassReview) => {
      const res = await apiRequest("POST", "/api/passes/review", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passes/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/passes/approved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/passes/rejected"] });
      
      setShowRejectDialog(false);
      setRejectReason("");
      setPassToReview(null);
      
      toast({
        title: "Pass request updated",
        description: "The pass request has been updated successfully.",
      });
    },
  });

  const handleViewPass = (pass: Pass & { student: UserType }) => {
    setSelectedPass(pass);
    setModalOpen(true);
  };

  const handleApprovePass = (pass: Pass) => {
    reviewPassMutation.mutate({
      passId: pass.id,
      status: "approved",
    });
  };

  const handleShowRejectDialog = (pass: Pass) => {
    setPassToReview(pass);
    setShowRejectDialog(true);
  };

  const handleRejectPass = () => {
    if (!passToReview) return;
    
    reviewPassMutation.mutate({
      passId: passToReview.id,
      status: "rejected",
      wardenNote: rejectReason,
    });
  };

  // Filter passes based on search query
  const filterPasses = (passes?: (Pass & { student: UserType })[]) => {
    if (!passes) return [];
    if (!searchQuery) return passes;
    
    return passes.filter((pass) => 
      pass.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pass.student.roomNo ? pass.student.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      pass.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredPendingPasses = filterPasses(pendingPasses);
  const filteredApprovedPasses = filterPasses(approvedPasses);
  const filteredRejectedPasses = filterPasses(rejectedPasses);

  const isPending = isLoadingPending && activeTab === "pending";
  const isApproved = isLoadingApproved && activeTab === "approved";
  const isRejected = isLoadingRejected && activeTab === "rejected";

  return (
    <DashboardLayout title="Warden Dashboard" icon={<User className="h-6 w-6" />}>
      {/* Tab Navigation */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Requests
              {pendingPasses && pendingPasses.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingPasses.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved Passes</TabsTrigger>
            <TabsTrigger value="rejected">Rejected Passes</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="pending">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Pending Pass Requests</h2>
              
              {isPending ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPendingPasses && filteredPendingPasses.length > 0 ? (
                <div className="bg-white rounded-lg divide-y divide-gray-200">
                  {filteredPendingPasses.map((pass) => (
                    <div key={pass.id} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <div className="mb-2 sm:mb-0">
                          <div className="flex items-center">
                            <div className="bg-primary-light rounded-full h-10 w-10 flex items-center justify-center text-white text-sm font-medium mr-3">
                              {pass.student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-md font-medium">{pass.student.name}</h3>
                              <div className="flex space-x-4 text-gray-600 text-sm">
                                <span>Room {pass.student.roomNo || 'N/A'}</span>
                                <span>{pass.student.course} {pass.student.batch}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium text-gray-800">
                            {pass.date}, {pass.timeSlot}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {pass.type} Pass
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 bg-gray-50 rounded-md p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Reason:</span>
                            <span className="ml-1 text-gray-800">{pass.reason}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Place:</span>
                            <span className="ml-1 text-gray-800">{pass.placeToVisit}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Contact:</span>
                            <span className="ml-1 text-gray-800">{pass.student.phoneNo}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end space-x-3">
                        <Button 
                          variant="outline" 
                          className="border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => handleShowRejectDialog(pass)}
                        >
                          Reject
                        </Button>
                        <Button 
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={() => handleApprovePass(pass)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No pending requests found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Approved Pass Requests</h2>
              
              {isApproved ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredApprovedPasses && filteredApprovedPasses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApprovedPasses.map((pass) => (
                        <tr key={pass.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-primary-light rounded-full flex items-center justify-center text-white text-xs">
                                {pass.student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{pass.student.name}</div>
                                <div className="text-xs text-gray-500">Room {pass.student.roomNo || "N/A"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pass.date}</div>
                            <div className="text-xs text-gray-500">{pass.timeSlot}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pass.placeToVisit}</div>
                            <div className="text-xs text-gray-500">{pass.reason}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                              Approved
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Button
                              variant="link"
                              className="text-primary hover:text-primary-dark"
                              onClick={() => handleViewPass(pass)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No approved passes found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Rejected Pass Requests</h2>
              
              {isRejected ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRejectedPasses && filteredRejectedPasses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason for Rejection
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRejectedPasses.map((pass) => (
                        <tr key={pass.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-primary-light rounded-full flex items-center justify-center text-white text-xs">
                                {pass.student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{pass.student.name}</div>
                                <div className="text-xs text-gray-500">Room {pass.student.roomNo || "N/A"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pass.date}</div>
                            <div className="text-xs text-gray-500">{pass.timeSlot}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{pass.wardenNote || "No reason provided"}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                              Rejected
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Button
                              variant="link"
                              className="text-primary hover:text-primary-dark"
                              onClick={() => handleViewPass(pass)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No rejected passes found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium mb-4">Reject Pass Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this pass request. This will be visible to the student.
            </p>
            
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              className="mb-4"
            />
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                  setPassToReview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleRejectPass}
                disabled={reviewPassMutation.isPending}
              >
                {reviewPassMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Pass
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
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
