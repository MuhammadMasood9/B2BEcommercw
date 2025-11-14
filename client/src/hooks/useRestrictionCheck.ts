import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface RestrictionStatus {
  isRestricted: boolean;
  totalUnpaid: number;
  creditLimit: number;
  creditUsed: number;
  creditRemaining: number;
  usagePercentage: number;
}

export function useRestrictionCheck() {
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionActionType, setRestrictionActionType] = useState<
    "quotation" | "inquiry" | "message"
  >("quotation");

  // Fetch restriction status
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['/api/suppliers/restriction-status'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/restriction-status', {
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const restrictionStatus: RestrictionStatus | null = statusData?.restrictionStatus || null;
  const isRestricted = restrictionStatus?.isRestricted || false;

  /**
   * Check if action is allowed, show modal if restricted
   * Returns true if action is allowed, false if restricted
   */
  const checkRestriction = (
    actionType: "quotation" | "inquiry" | "message"
  ): boolean => {
    if (isRestricted) {
      setRestrictionActionType(actionType);
      setShowRestrictionModal(true);
      return false;
    }
    return true;
  };

  /**
   * Check restriction and execute callback if allowed
   */
  const withRestrictionCheck = <T extends any[]>(
    actionType: "quotation" | "inquiry" | "message",
    callback: (...args: T) => void
  ) => {
    return (...args: T) => {
      if (checkRestriction(actionType)) {
        callback(...args);
      }
    };
  };

  return {
    isRestricted,
    restrictionStatus,
    isLoading,
    showRestrictionModal,
    setShowRestrictionModal,
    restrictionActionType,
    checkRestriction,
    withRestrictionCheck,
  };
}
