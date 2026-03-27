'use client';

import { forwardRef } from "react";
import { cn } from "@/app/lib/utils";
import {
  Check,
  Pencil,
  X,
  ChevronLeft,
  Plus,
  MoreVertical,
} from 'lucide-react';

type FabType = 'save' | 'edit' | 'delete' | 'back' | 'add' | 'menu';

const icons = {
  save: Check,
  edit: Pencil,
  delete: X,
  back: ChevronLeft,
  add: Plus,
  menu: MoreVertical,
};

interface FabProps {
  type: FabType;
  onClick?: () => void;
  disabled?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
  children?: React.ReactNode;   // ← ADD THIS
}

export const Fab = forwardRef<HTMLButtonElement, FabProps>(
  ({ type, position = "bottom-right", className, children, ...props }, ref) => {
    const Icon = icons[type];

    const posClass =
      position === "bottom-right"
        ? "fixed bottom-6 right-6"
        : "fixed bottom-6 left-6";

    return (
      <button
        ref={ref}
        type="button"
        {...props}
        className={cn(
          `
          h-10 w-10 rounded-full shadow-xl
          bg-white/10 backdrop-blur-sm border border-white/10
          text-white
          hover:bg-white/25 active:bg-white/10
          flex items-center justify-center p-0
          disabled:opacity-50 enabled:opacity-100
          pointer-events-auto
          `,
          posClass,
          className
        )}
      >
        {children ? children : <Icon className="h-5 w-5" />}  {/* ← USE CHILDREN IF PROVIDED */}
      </button>
    );
  }
);

Fab.displayName = "Fab";
