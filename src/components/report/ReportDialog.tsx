'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, FileText } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPDF: () => void;
  onExcel: () => void;
  title: string;
}

export function ReportDialog({ open, onOpenChange, onPDF, onExcel, title }: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download {title} Report</DialogTitle>
          <DialogDescription>
            Choose your desired file format for the report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Button variant="outline" onClick={onPDF} size="lg">
            <FileText className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={onExcel} size="lg">
            <FileDown className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
