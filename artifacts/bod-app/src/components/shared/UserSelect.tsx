import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMembers, type UserDoc } from "@/hooks/useMembers";
import { useLang } from "@/contexts/LangContext";

interface UserSelectProps {
  value: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
  members?: UserDoc[];
}

export function UserSelect({
  value,
  onChange,
  placeholder,
  members: membersProp,
}: UserSelectProps) {
  const { t } = useLang();
  const resolvedPlaceholder = placeholder ?? t.selectUsers;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { members: allMembers, loading } = useMembers();
  const members = membersProp ?? allMembers;

  const filtered = search
    ? members.filter((m) =>
        `${m.displayName} ${m.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : members;

  const selectedMembers = members.filter((m) => value.includes(m.id));

  const toggle = (memberId: string) => {
    if (value.includes(memberId)) {
      onChange(value.filter((id) => id !== memberId));
    } else {
      onChange([...value, memberId]);
    }
  };

  const renderTriggerLabel = () => {
    if (selectedMembers.length === 0) {
      return <span className="text-muted-foreground">{resolvedPlaceholder}</span>;
    }
    if (selectedMembers.length === 1) {
      const m = selectedMembers[0];
      return (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={m.avatar} />
            <AvatarFallback className="text-xs">
              {(m.displayName?.[0] ?? m.email[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{m.displayName || m.email}</span>
        </span>
      );
    }
    return (
      <span className="flex min-w-0 items-center gap-2">
        <div className="flex -space-x-1.5 shrink-0">
          {selectedMembers.slice(0, 3).map((m) => (
            <Avatar key={m.id} className="h-5 w-5 ring-2 ring-background">
              <AvatarImage src={m.avatar} />
              <AvatarFallback className="text-xs">
                {(m.displayName?.[0] ?? m.email[0]).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="truncate text-sm">
          {selectedMembers.length} {t.membersSelected}
        </span>
      </span>
    );
  };

  return (
    <div className="w-full">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {renderTriggerLabel()}
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
              placeholder={t.searchUsers}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? t.loading : t.noUsersFound}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.id}
                    onSelect={() => toggle(member.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value.includes(member.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Avatar className="mr-2 h-6 w-6 shrink-0">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {(
                          member.displayName?.[0] ?? member.email[0]
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">
                        {member.displayName}
                      </span>
                      <span className="truncate text-xs text-neutral-400">
                        {member.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
