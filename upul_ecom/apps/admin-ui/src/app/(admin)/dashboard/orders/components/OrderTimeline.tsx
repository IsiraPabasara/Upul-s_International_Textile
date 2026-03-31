"use client";

import React from "react";
import { Check, Package, Truck, Home, Clock, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  status: string;
  date: string;
}

export default function OrderTimeline({ status, date }: TimelineProps) {
  
  const steps = [
    { id: "PENDING", label: "Placed", icon: Clock },
    { id: "CONFIRMED", label: "Confirmed", icon: Check },
    { id: "PROCESSING", label: "Processing", icon: Package },
    { id: "SHIPPED", label: "Shipped", icon: Truck },
    { id: "DELIVERED", label: "Delivered", icon: Home },
  ];

  const isCancelled = status === "CANCELLED";
  const isReturned = status === "RETURNED";
  
  // Find index: e.g., if status is PROCESSING (index 2)
  const currentStepIndex = steps.findIndex((s) => s.id === status);

  // 1. Terminated Order Banner (Same as before)
  if (isCancelled || isReturned) {
     return (
       <div className={cn(
         "w-full p-6 rounded-[2rem] border flex items-center justify-between mb-8",
         isCancelled 
            ? "bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900" 
            : "bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900"
       )}>
          <div className="flex items-center gap-4">
             <div className={cn("p-3 rounded-full", isCancelled ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                {isCancelled ? <XCircle size={24} /> : <RotateCcw size={24} />}
             </div>
             <div>
                <h3 className={cn("text-lg font-black", isCancelled ? "text-red-700 dark:text-red-400" : "text-orange-700 dark:text-orange-400")}>
                  Order {isCancelled ? "Cancelled" : "Returned"}
                </h3>
                <p className={cn("text-sm font-medium opacity-80", isCancelled ? "text-red-600" : "text-orange-600")}>
                  This order has been terminated.
                </p>
             </div>
          </div>
       </div>
     );
  }

  // 2. The Segmented Flex Timeline
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 sm:p-8 rounded-[2rem] shadow-sm mb-8">
      
      {/* Standard Flex Container 
         Items will be laid out: [Step] - [Line] - [Step] - [Line] - [Step]
      */}
      <div className="flex items-center justify-between w-full">
        
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isLast = index === steps.length - 1;
          
          // Determine if the line *following* this step should be colored
          // Example: If current is PROCESSING (2), the line after CONFIRMED (1) should be colored.
          const isLineActive = index < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              
              {/* === THE STEP CIRCLE === */}
              <div className="relative flex flex-col items-center group z-10">
                <div 
                  className={cn(
                    "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-[3px] sm:border-4",
                    isCompleted 
                      ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black scale-100 shadow-lg" 
                      : "bg-white border-gray-200 text-gray-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-600"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </div>

                {/* Label (Absolute to keep spacing clean) */}
                <p className={cn(
                  "text-[8px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 absolute -bottom-6 sm:-bottom-8 w-24 text-center",
                  isCompleted ? "text-black dark:text-white" : "text-gray-300 dark:text-slate-600"
                )}>
                  {step.label}
                </p>
              </div>

              {/* === THE CONNECTOR LINE === */}
              {/* Only render if it's NOT the last item */}
              {!isLast && (
                <div className="flex-1 h-0.5 sm:h-1 mx-2 sm:mx-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   {/* The Progress Fill */}
                   <div 
                     className={cn(
                       "h-full bg-black dark:bg-white transition-all duration-700 ease-in-out origin-left",
                       isLineActive ? "w-full" : "w-0"
                     )} 
                   />
                </div>
              )}

            </React.Fragment>
          );
        })}
      </div>
      
      {/* Spacer for bottom labels */}
      <div className="h-6 sm:h-8" />
    </div>
  );
}