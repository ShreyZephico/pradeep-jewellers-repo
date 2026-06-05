"use client";

import { useCallback, useEffect, useState } from "react";

import type { CustomerProfile } from "@/components/profile/profileShared";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

export function useCustomerProfile() {
  const { isLoggedIn, loading: authLoading, goToLogin } = useCustomerAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/customer/profile", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        goToLogin();
        return;
      }

      const data = await parseJsonResponse<{
        success?: boolean;
        profile?: CustomerProfile;
        hasPassword?: boolean;
        error?: string;
      }>(response);

      if (!data?.success || !data.profile) {
        throw new Error(data?.error || "Could not load profile.");
      }

      setProfile(data.profile);
      setHasPassword(Boolean(data.hasPassword));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load profile."
      );
    } finally {
      setLoading(false);
    }
  }, [goToLogin]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    void loadProfile();
  }, [authLoading, isLoggedIn, goToLogin, loadProfile]);

  return {
    profile,
    setProfile,
    hasPassword,
    setHasPassword,
    loading: authLoading || loading,
    error,
    reload: loadProfile,
  };
}
