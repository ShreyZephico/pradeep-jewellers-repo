"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchPincodeLookup,
  formatDeliveryDays,
  isValidPincodeFormat,
  normalizePincodeInput,
  type PincodeLookupResult,
} from "@/lib/pincodeDelivery";
import {
  autoDetectDeliveryPincode,
  writeSavedDeliveryPincode,
  type DeliveryLocationStatus,
} from "@/lib/deliveryLocation";

type DeliveryLocationContextValue = {
  pincode: string | null;
  areaLabel: string | null;
  districtLabel: string | null;
  deliveryDaysLabel: string | null;
  deliveryResult: PincodeLookupResult | null;
  status: DeliveryLocationStatus;
  lookupLoading: boolean;
  updatePincode: (raw: string) => Promise<boolean>;
};

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(
  null
);

function districtFromArea(areaLabel: string, district: string): string {
  const fromDistrict = district.trim();
  if (fromDistrict) {
    return fromDistrict;
  }
  return areaLabel.split(",")[0]?.trim() || areaLabel;
}

export function DeliveryLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pincode, setPincode] = useState<string | null>(null);
  const [areaLabel, setAreaLabel] = useState<string | null>(null);
  const [districtLabel, setDistrictLabel] = useState<string | null>(null);
  const [deliveryDaysLabel, setDeliveryDaysLabel] = useState<string | null>(null);
  const [deliveryResult, setDeliveryResult] = useState<PincodeLookupResult | null>(
    null
  );
  const [status, setStatus] = useState<DeliveryLocationStatus>("idle");
  const [lookupLoading, setLookupLoading] = useState(false);

  const applyLookupResult = useCallback((lookup: PincodeLookupResult) => {
    setPincode(lookup.pincode);
    setAreaLabel(lookup.areaLabel);
    setDistrictLabel(districtFromArea(lookup.areaLabel, lookup.district));
    setDeliveryDaysLabel(
      formatDeliveryDays(lookup.deliveryDaysMin, lookup.deliveryDaysMax)
    );
    setDeliveryResult(lookup);
    setStatus("ready");
    writeSavedDeliveryPincode(lookup.pincode);
  }, []);

  const resolvePincodeLookup = useCallback(
    async (raw: string): Promise<boolean> => {
      const normalized = normalizePincodeInput(raw);
      if (!isValidPincodeFormat(normalized)) {
        return false;
      }

      setLookupLoading(true);
      try {
        const lookup = await fetchPincodeLookup(normalized);
        if ("code" in lookup) {
          return false;
        }
        applyLookupResult(lookup);
        return true;
      } finally {
        setLookupLoading(false);
      }
    },
    [applyLookupResult]
  );

  const updatePincode = useCallback(
    async (raw: string) => resolvePincodeLookup(raw),
    [resolvePincodeLookup]
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!cancelled) {
        setStatus("locating");
      }

      const detected = await autoDetectDeliveryPincode();
      if (!detected) {
        if (!cancelled) {
          setStatus("idle");
        }
        return;
      }

      const ok = await resolvePincodeLookup(detected.pincode);
      if (!cancelled && !ok) {
        setStatus("unavailable");
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [resolvePincodeLookup]);

  const value = useMemo(
    () => ({
      pincode,
      areaLabel,
      districtLabel,
      deliveryDaysLabel,
      deliveryResult,
      status,
      lookupLoading,
      updatePincode,
    }),
    [
      pincode,
      areaLabel,
      districtLabel,
      deliveryDaysLabel,
      deliveryResult,
      status,
      lookupLoading,
      updatePincode,
    ]
  );

  return (
    <DeliveryLocationContext.Provider value={value}>
      {children}
    </DeliveryLocationContext.Provider>
  );
}

export function useDeliveryLocation(): DeliveryLocationContextValue {
  const context = useContext(DeliveryLocationContext);
  if (!context) {
    return {
      pincode: null,
      areaLabel: null,
      districtLabel: null,
      deliveryDaysLabel: null,
      deliveryResult: null,
      status: "idle",
      lookupLoading: false,
      updatePincode: async () => false,
    };
  }
  return context;
}
