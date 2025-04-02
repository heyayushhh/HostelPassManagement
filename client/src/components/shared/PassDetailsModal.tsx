import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { Pass, User } from "@shared/schema";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PassDetailsModalProps {
  pass: Pass & { student?: User; warden?: User };
  isOpen: boolean;
  onClose: () => void;
}

export default function PassDetailsModal({ pass, isOpen, onClose }: PassDetailsModalProps) {
  if (!pass) return null;

  const student = pass.student;
  const warden = pass.warden;

  // Get the first letter of first and last name for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const statusColor = 
    pass.status === "approved" 
      ? "text-green-600" 
      : pass.status === "rejected" 
        ? "text-red-600" 
        : "text-yellow-600";

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Gate Pass Details</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {student && (
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                {student.profilePhoto ? (
                  <AvatarImage src={student.profilePhoto} alt={student.name} />
                ) : (
                  <AvatarFallback className="bg-primary-light text-white text-lg font-medium">
                    {getInitials(student.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h4 className="text-md font-medium">{student.name}</h4>
                <p className="text-sm text-gray-600">
                  {student.course} {student.batch}, Room {student.roomNo}
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className={`text-sm font-medium capitalize ${statusColor}`}>
                  {pass.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Out Date</p>
                <p className="text-sm font-medium">{formatDate(pass.outDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Out Time</p>
                <p className="text-sm font-medium">{pass.outTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">In Date</p>
                <p className="text-sm font-medium">{formatDate(pass.inDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">In Time</p>
                <p className="text-sm font-medium">{pass.inTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Destination</p>
                <p className="text-sm font-medium">{pass.destination}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Student Contact</p>
                <p className="text-sm font-medium">{pass.contactNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Parent Contact</p>
                <p className="text-sm font-medium">{pass.parentContactNo || "Not provided"}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500">Reason</p>
              <p className="text-sm font-medium">{pass.reason}</p>
            </div>
            
            {pass.wardenNote && (
              <div className="mt-3">
                <p className="text-xs text-gray-500">Warden Note</p>
                <p className="text-sm font-medium">{pass.wardenNote}</p>
              </div>
            )}
          </div>
          
          {pass.status !== "pending" && warden && (
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500">Approval Information</p>
              <div className="flex justify-between mt-1">
                <p className="text-sm">
                  {pass.status === "approved" ? "Approved" : "Rejected"} by:{" "}
                  <span className="font-medium">{warden.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  {pass.updatedAt ? formatDate(pass.updatedAt.toString()) + " • " + format(new Date(pass.updatedAt), "h:mm a") : ""}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {pass.status === "approved" && (
            <Button className="bg-primary text-white">
              <Printer className="h-4 w-4 mr-2" />
              Print Pass
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
