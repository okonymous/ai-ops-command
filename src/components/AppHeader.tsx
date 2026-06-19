import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, useTeamMembers } from "@/hooks/useData";
import { ROLE_META } from "@/lib/constants";
import { toast } from "sonner";

export function AppHeader({
  onMenuClick,
  onOpenChat,
}: {
  onMenuClick: () => void;
  onOpenChat: () => void;
}) {
  const { theme, setTheme, resolved } = useTheme();
  const { profile, user, primaryRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useTeamMembers();
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-xl border bg-background/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-background"
      >
        <Search className="h-4 w-4" />
        <span className="truncate">Search tasks, engineers...</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 text-[10px] sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button onClick={onOpenChat} className="gap-2" size="sm">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Assistant</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
          title={`Theme: ${theme}`}
        >
          {resolved === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="truncate font-medium">{profile?.full_name || "User"}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
                {primaryRole && (
                  <Badge className={`mt-1.5 w-fit ${ROLE_META[primaryRole].className}`} variant="secondary">
                    {ROLE_META[primaryRole].label}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <UserIcon className="h-4 w-4" /> Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search tasks and engineers..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Tasks">
            {tasks.slice(0, 8).map((t) => (
              <CommandItem
                key={t.id}
                value={t.title}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: "/tasks" });
                }}
              >
                {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Engineers">
            {members.slice(0, 8).map((m) => (
              <CommandItem
                key={m.id}
                value={m.name}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: "/team" });
                }}
              >
                {m.name} — {m.position}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
