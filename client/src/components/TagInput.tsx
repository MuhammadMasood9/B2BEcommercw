import React, { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Type and press Enter to add tags",
  maxTags,
  className,
  disabled = false,
  label,
  description,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !value.includes(trimmedTag) &&
      (!maxTags || value.length < maxTags)
    ) {
      onChange([...value, trimmedTag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Remove commas and split by comma if user pastes comma-separated values
    if (newValue.includes(",")) {
      const tags = newValue
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      tags.forEach((tag) => addTag(tag));
      setInputValue("");
    } else {
      setInputValue(newValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const tags = pastedText
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    
    const newTags = [...value];
    tags.forEach((tag) => {
      if (!newTags.includes(tag) && (!maxTags || newTags.length < maxTags)) {
        newTags.push(tag);
      }
    });
    onChange(newTags);
    setInputValue("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      
      <div className="min-h-[40px] p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary/100 focus-within:border-primary transition-colors">
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 text-sm bg-primary text-primary hover:bg-primary dark:bg-primary dark:text-primary dark:hover:bg-primary"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-primary dark:hover:bg-primary rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
        
        {(!maxTags || value.length < maxTags) && !disabled && (
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto min-w-[120px] flex-1"
              disabled={disabled}
            />
            {inputValue && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => addTag(inputValue)}
                className="h-6 w-6 p-0 hover:bg-primary dark:hover:bg-primary"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {maxTags && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}

export default TagInput;
