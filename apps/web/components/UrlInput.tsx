"use client";

import useForwardRef from "@/hooks/useForwardRef";
import { BanIcon, ChevronRightIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { forwardRef, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

interface UrlInputProps extends InputProps {
  isLoading: boolean;
  isReady: boolean;
  handleUrlSubmit: (url: string) => Promise<void>;
}

const Spinner = ({ className }: { className?: string }) => {
  return <Loader2 size={16} className={cn("animate-spin", className)} />;
};

const UrlInput = forwardRef<HTMLInputElement, UrlInputProps>(
  ({ isLoading, isReady, handleUrlSubmit, className, ...props }, ref) => {
    const forwardedRef = useForwardRef<HTMLInputElement>(ref);
    const handleButtonClick = useCallback(() => {
      if (forwardedRef.current) {
        handleUrlSubmit(forwardedRef.current.value);
      }
    }, [forwardedRef, handleUrlSubmit]);

    return (
      <div className="flex-col flex gap-2">
        <Label htmlFor="yt-url">Enter Youtube Live url</Label>
        <div className="relative">
          <Input
            type="url"
            id="yt-url"
            placeholder="for example: https://www.youtube.com/watch?v=YxdntrSbAcg"
            className={cn("pr-10", className)}
            ref={forwardedRef}
            disabled={isReady}
            {...props}
          />
          <Button
            type="button"
            size="sm"
            className="absolute right-0 top-0 h-full rounded-l-none px-3 py-2 border border-secondary border-l-0"
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner />
            ) : isReady ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <BanIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Terminate current process</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  },
);

UrlInput.displayName = "UrlInput";

export default UrlInput;
