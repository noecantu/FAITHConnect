'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, FileText } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Member } from '@/lib/types';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPDF: (memberId: string) => void;
  onExcel: (memberId: string) => void;
  title: string;
  members: Member[];
}

export function ReportDialog({ open, onOpenChange, onPDF, onExcel, title, members }: ReportDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('all');

  // Reset selection when dialog opens/closes or title changes
  useEffect(() => {
    if (open) {
      setSelectedMemberId('all');
    }
  }, [open, title]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [members]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download {title} Report</DialogTitle>
          <DialogDescription>
            Choose your desired file format for the report.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {title === 'Contributions' && (
            <div className="space-y-2">
              <Label htmlFor="member-select">Select Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger id="member-select">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Members</SelectItem>
                  {sortedMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.lastName}, {member.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => onPDF(selectedMemberId)} size="lg">
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => onExcel(selectedMemberId)} size="lg">
              <FileDown className="mr-2 h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
