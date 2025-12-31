import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: any) => void;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, value, onValueChange, onChange, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      value={value}
      onChange={(e) => {
        onChange?.(e)
        onValueChange?.(e.target.value)
      }}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  )
)
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => (
  <div className={cn("mt-1", className)}>
    {children}
  </div>
)

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <option
      ref={ref}
      className={cn("py-2 px-3 hover:bg-orange-50", className)}
      {...props}
    >
      {children}
    </option>
  )
)
SelectItem.displayName = "SelectItem"

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
)

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
}