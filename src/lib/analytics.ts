import { logEvent } from "firebase/analytics";
import { analyticsPromise } from "./firebase";

export interface MediaInteractionParams {
  property_id: string;
  media_type: "flambient_gallery" | "drone_video" | "matterport_tour" | "zillow_3d" | string;
  action: "view" | "play" | "expand" | "download" | string;
  [key: string]: any;
}

export interface GenerateLeadParams {
  form_name: "booking_request" | "general_inquiry" | string;
  service_requested: "full_package" | "drone_only" | "flambient_only" | string;
  [key: string]: any;
}

export type EventParams = 
  | { eventName: "page_view"; params: { page_path: string; page_title?: string; [key: string]: any } }
  | { eventName: "media_interaction"; params: MediaInteractionParams }
  | { eventName: "generate_lead"; params: GenerateLeadParams }
  | { eventName: string; params?: Record<string, any> };

/**
 * Robust utility function to log events to Firebase Analytics.
 * It handles missing analytics instances (e.g. ad blockers).
 */
export const trackEvent = async (eventName: string, params?: Record<string, any>) => {
  try {
    // Try sending event through the google tag script injected in index.html
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag('event', eventName, params);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Analytics - gtag] Tracked ${eventName}`, params);
      }
    }

    // Try sending through Firebase Analytics SDK
    const analytics = await analyticsPromise;
    if (analytics) {
      logEvent(analytics, eventName, params);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Analytics - Firebase] Tracked ${eventName}`, params);
      }
    } else {
      if (process.env.NODE_ENV !== "production" && typeof (window as any).gtag !== "function") {
        console.warn(`[Analytics] Blocked or unsupported. Event ${eventName} not tracked.`, params);
      }
    }
  } catch (error) {
    console.error("[Analytics] Error logging event:", error);
  }
};

/**
 * Type-safe wrappers for common business events.
 */
export const trackMediaInteraction = (params: MediaInteractionParams) => {
  trackEvent("media_interaction", params);
}

export const trackGenerateLead = (params: GenerateLeadParams) => {
  trackEvent("generate_lead", params);
}

export const trackPageView = (page_path: string, page_title?: string) => {
  trackEvent("page_view", { page_path, page_title });
}
