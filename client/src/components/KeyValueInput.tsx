import React, { useState, useEffect } from "react";
import { X, Plus, Key, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueInputProps {
  value: Record<string, string>;
  onChange: (specifications: Record<string, string>) => void;
  placeholder?: string;
  maxPairs?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function KeyValueInput({
  value = {},
  onChange,
  placeholder = "Enter key-value pairs for specifications",
  maxPairs,
  className,
  disabled = false,
  label,
  description,
}: KeyValueInputProps) {
  const [pairs, setPairs] = useState<KeyValuePair[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  // Convert value object to pairs array
  useEffect(() => {
    const pairsArray = Object.entries(value).map(([key, val]) => ({
      key,
      value: val,
    }));
    setPairs(pairsArray);
  }, [value]);

  // Convert pairs array back to value object
  const updateValue = (newPairs: KeyValuePair[]) => {
    const newValueObj: Record<string, string> = {};
    newPairs.forEach((pair) => {
      if (pair.key.trim()) {
        newValueObj[pair.key.trim()] = pair.value.trim();
      }
    });
    onChange(newValueObj);
  };

  const addPair = () => {
    if (newKey.trim() && newValue.trim() && (!maxPairs || pairs.length < maxPairs)) {
      const newPair: KeyValuePair = {
        key: newKey.trim(),
        value: newValue.trim(),
      };
      
      // Check if key already exists
      if (pairs.some(pair => pair.key.toLowerCase() === newKey.trim().toLowerCase())) {
        return; // Don't add duplicate keys
      }
      
      const newPairs = [...pairs, newPair];
      setPairs(newPairs);
      updateValue(newPairs);
      setNewKey("");
      setNewValue("");
    }
  };

  const removePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
    updateValue(newPairs);
  };

  const updatePair = (index: number, field: 'key' | 'value', newVal: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: newVal };
    setPairs(newPairs);
    updateValue(newPairs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPair();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    
    // Try to parse as JSON first
    try {
      const jsonData = JSON.parse(pastedText);
      if (typeof jsonData === 'object' && jsonData !== null) {
        const newPairs: KeyValuePair[] = Object.entries(jsonData).map(([key, val]) => ({
          key: String(key),
          value: String(val),
        }));
        setPairs(newPairs);
        updateValue(newPairs);
        return;
      }
    } catch {
      // Not JSON, try to parse as key:value pairs
      const lines = pastedText.split('\n').filter(line => line.trim());
      const newPairs: KeyValuePair[] = [];
      
      lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key && value) {
            newPairs.push({ key, value });
          }
        }
      });
      
      if (newPairs.length > 0) {
        setPairs(newPairs);
        updateValue(newPairs);
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      
      {/* Existing pairs */}
      {pairs.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-3">
              {pairs.map((pair, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-gray-500" />
                      <Input
                        value={pair.key}
                        onChange={(e) => updatePair(index, 'key', e.target.value)}
                        placeholder="Specification name"
                        className="border-0 shadow-none bg-transparent p-0 h-auto"
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <Input
                        value={pair.value}
                        onChange={(e) => updatePair(index, 'value', e.target.value)}
                        placeholder="Specification value"
                        className="border-0 shadow-none bg-transparent p-0 h-auto"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePair(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Add new pair */}
      {(!maxPairs || pairs.length < maxPairs) && !disabled && (
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Specification name"
                    className="border-0 shadow-none bg-transparent p-0 h-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Specification value"
                    className="border-0 shadow-none bg-transparent p-0 h-auto"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Press Enter to add, or paste JSON/key:value format
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={addPair}
                  disabled={!newKey.trim() || !newValue.trim()}
                  className="h-8 px-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {maxPairs && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {pairs.length}/{maxPairs} specifications
        </p>
      )}
    </div>
  );
}

export default KeyValueInput;
