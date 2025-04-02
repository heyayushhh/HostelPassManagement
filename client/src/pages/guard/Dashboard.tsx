import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PassDetailsModal from "@/components/shared/PassDetailsModal";
import { Shield, Search, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Pass, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function GuardDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyQuery, setVerifyQuery] = useState("");
  const [selectedPass, setSelectedPass] = useState<(Pass & { student?: User }) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch approved passes for the selected date
  const { data: approvedPasses, isLoading } = useQuery({
    queryKey: ["/api/passes/approved", selectedDate],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/passes/approved?date=${selectedDate}`);
      const data = await res.json();
      return data.passes as (Pass & { student: User })[];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already reactive with the input change
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would validate if the student has a valid pass
    // But for this demo, we'll just filter the existing passes
  };

  const handleViewPass = (pass: Pass & { student: User }) => {
    setSelectedPass(pass);
    setModalOpen(true);
  };

  const handleExport = () => {
    // In a real app, this would generate a CSV or Excel file
    alert("Exporting data is not implemented in this demo");
  };

  // Filter passes based on search query
  const filteredPasses = approvedPasses
    ? approvedPasses.filter(
        (pass) =>
          pass.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pass.student.roomNo ? pass.student.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
          pass.placeToVisit.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Filter passes based on verify query
  const verifiedPass = verifyQuery
    ? approvedPasses?.find(
        (pass) =>
          pass.student.name.toLowerCase().includes(verifyQuery.toLowerCase()) ||
          pass.student.username.toLowerCase() === verifyQuery.toLowerCase()
      )
    : null;

  return (
    <DashboardLayout title="Guard Dashboard" icon={<Shield className="h-6 w-6" />}>
      {/* Date Filter */}
      <div className="bg-white shadow-sm rounded-lg mb-6">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between">
          <h2 className="text-lg font-medium mb-2 sm:mb-0">Approved Gate Passes</h2>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button className="bg-primary text-white">Filter</Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Verify */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              placeholder="Enter student name or ID to verify"
              value={verifyQuery}
              onChange={(e) => setVerifyQuery(e.target.value)}
              className="flex-grow"
            />
            <Button className="bg-primary text-white" type="submit">
              <Search className="h-4 w-4 mr-2" />
              Verify
            </Button>
          </form>

          {verifyQuery && (
            <div className="mt-4">
              {verifiedPass ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800">
                    <strong>{verifiedPass.student.name}</strong> has a valid approved pass for {verifiedPass.date} ({verifiedPass.timeSlot})
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                  <Shield className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800">No approved pass found for this student today</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passes Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Today's Approved Passes</h3>
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                placeholder="Search passes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64"
              />
              <Button variant="ghost" size="icon" type="submit">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPasses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room & Batch
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Place
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
                  {filteredPasses.map((pass) => (
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
                            <div className="text-xs text-gray-500">{pass.student.phoneNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pass.timeSlot}</div>
                        <div className="text-xs text-gray-500 capitalize">{pass.type}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pass.student.roomNo || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{pass.student.course} {pass.student.batch}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pass.placeToVisit}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{pass.reason}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                          {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Button
                          variant="link"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => handleViewPass(pass)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No approved passes found for {selectedDate}
            </div>
          )}
        </CardContent>
      </Card>

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
