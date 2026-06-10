import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAllTasksQuery } from "@/hooks/useTaskQueries";
import { useLang } from "@/contexts/LangContext";
import type { TaskQueryParams } from "@/types";

interface TaskSelectProps {
  value: string | null;
  onChange: (taskId: string | null) => void;
  placeholder?: string;
  params?: Omit<TaskQueryParams, "search">;
}

export function TaskSelect({
  value,
  onChange,
  placeholder,
  params,
}: TaskSelectProps) {
  const { t } = useLang();
  const resolvedPlaceholder = placeholder ?? t.selectTask;
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: tasks = [], isLoading } = useAllTasksQuery({
    ...params,
    search: debouncedSearch || undefined,
  });

  const selected = tasks.find((t) => t.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? selected.title : resolvedPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t.searchTasks}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? t.loading : t.noTasksFound}
            </CommandEmpty>
            <CommandGroup>
              {tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={task.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? null : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === task.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
