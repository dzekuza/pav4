import React, { useState } from "react";
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
import { LogOut, User, Settings, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDropdownProps {
  businessName: string;
  businessDomain: string;
  businessLogo?: string | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  className?: string;
  isMobile?: boolean;
}

export function ProfileDropdown({
  businessName,
  businessDomain,
  businessLogo,
  onLogout,
  onNavigate,
  className,
  isMobile = false,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            isMobile
              ? "relative h-8 w-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-all duration-200"
              : "relative h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200",
            className,
          )}
        >
          {businessLogo ? (
            <Avatar className={cn(isMobile ? "h-5 w-5" : "h-8 w-8")}>
              <AvatarImage src={businessLogo} alt={businessName} />
              <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                {getInitials(businessName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className={cn(isMobile ? "h-5 w-5" : "h-8 w-8")}>
              <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                {getInitials(businessName)}
              </AvatarFallback>
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 border-white/10 bg-black/95 backdrop-blur-md text-white"
      >
        <DropdownMenuLabel className="text-white/90 font-medium">
          <div className="flex items-center gap-3 p-2">
            {businessLogo ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={businessLogo} alt={businessName} />
                <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
                  {getInitials(businessName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
                  {getInitials(businessName)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {businessName}
              </span>
              <span className="text-xs text-white/60">{businessDomain}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          onClick={() => {
            onNavigate("/business/dashboard/checkout/settings");
            setIsOpen(false);
          }}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            onNavigate("/business/dashboard/checkout/settings");
            setIsOpen(false);
          }}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          onClick={() => {
            onLogout();
            setIsOpen(false);
          }}
          className="text-red-400 hover:bg-red-400/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
