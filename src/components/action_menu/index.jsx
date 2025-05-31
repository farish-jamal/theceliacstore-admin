import { Ellipsis } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const ActionMenu = ({ options = [] }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
          <Button variant="outline">
            <Ellipsis className="w-5 h-5" />
          </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-40 p-2 space-y-1 text-sm text-gray-700 shadow-lg"
      >
        {options.map(({ label, icon: Icon, action, className }, index) => (
          <button
            key={index}
            onClick={action}
            className={cn(
              "flex w-full items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-left",
              className
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default ActionMenu;
