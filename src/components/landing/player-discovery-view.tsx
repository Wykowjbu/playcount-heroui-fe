"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth-context";
import { getMyProfile, getMySports, getSportsOptions } from "@/lib/api/profile";
import {
  getRecommendationState,
  type LocationState,
  type DiscoveryVenue,
  type DiscoveryMatch,
} from "@/lib/types/discovery";
import {
  mockVenues,
  mockMatches,
  filterVenuesBySports,
  filterMatchesBySports,
  sortByDistance,
} from "../../mocks/discovery";
import { DiscoveryHero } from "./discovery-hero";
import { RecommendedVenuesSection } from "./recommended-venues-section";
import { ActiveMatchesSection } from "./active-matches-section";
import { LocationConsentCard } from "./location-consent-card";
import { PersonalizationCard } from "./personalization-card";
import { SportsCategories } from "./sports-categories";
import { PlayerBottomNav } from "@/components/layout/player-bottom-nav";

interface Props {
  user: AuthUser;
}

export function PlayerDiscoveryView({ user }: Props) {
  const [loading, setLoading] = useState(true);
  const [userSports, setUserSports] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationState>({ source: null });
  const [showLocationCard, setShowLocationCard] = useState(false);
  const [showSportCard, setShowSportCard] = useState(false);
  const [availableSports, setAvailableSports] = useState<{ id: number; name: string }[]>([]);
  const [venues, setVenues] = useState<DiscoveryVenue[]>([]);
  const [matches, setMatches] = useState<DiscoveryMatch[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const router = useRouter();

  // Load profile + sports on mount (useCallback avoids setState-in-effect lint error)
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, mySports, allSports] = await Promise.all([
        getMyProfile(user.accessToken).catch(() => null),
        getMySports(user.accessToken).catch(() => []),
        getSportsOptions(user.accessToken).catch(() => []),
      ]);

      const sportNames = mySports.map((s) => s.sportName);
      setUserSports(sportNames);
      setAvailableSports(allSports.map((s) => ({ id: s.sportId, name: s.sportName })));

      const hasLocation = !!profile?.city;
      if (profile?.city) {
        setLocation({ city: profile.city, source: "profile" });
      }

      // Determine recommendation state and show inline cards
      const recState = getRecommendationState(sportNames.length > 0, hasLocation);
      if (recState === "B") setShowLocationCard(true);
      if (recState === "C") setShowSportCard(true);
      if (recState === "D") {
        setShowLocationCard(true);
        setShowSportCard(true);
      }
    } catch {
      // Profile fetch failed, continue with empty state
    } finally {
      setLoading(false);
    }
  }, [user.accessToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load venues (mock for now, can swap to API)
  const loadVenues = useCallback(() => {
    const t = setTimeout(() => {
      setVenuesLoading(true);
      let result = [...mockVenues];
      if (userSports.length > 0) {
        result = filterVenuesBySports(result, userSports);
        if (result.length < 3) {
          const popular = mockVenues.filter((v) => !result.find((r) => r.id === v.id));
          result = [...result, ...popular.slice(0, 3 - result.length)];
        }
      }
      if (location.city) {
        result = sortByDistance(result);
      }
      setVenues(result.slice(0, 6));
      setVenuesLoading(false);
    }, 200);
    return t;
  }, [userSports, location]);

  useEffect(() => {
    const t = loadVenues();
    return () => clearTimeout(t);
  }, [loadVenues]);

  // Load matches (mock for now)
  const loadMatches = useCallback(() => {
    const t = setTimeout(() => {
      setMatchesLoading(true);
      let result = [...mockMatches];
      if (userSports.length > 0) {
        result = filterMatchesBySports(result, userSports);
        if (result.length === 0) result = [...mockMatches];
      }
      setMatches(result.slice(0, 6));
      setMatchesLoading(false);
    }, 200);
    return t;
  }, [userSports]);

  useEffect(() => {
    const t = loadMatches();
    return () => clearTimeout(t);
  }, [loadMatches]);

  // Subtitle for recommended section
  const getSubtitle = () => {
    const hasSports = userSports.length > 0;
    const hasLocation = location.city != null || location.lat != null;
    if (hasSports && hasLocation) return "Dựa trên môn bạn hay chơi và khu vực gần bạn";
    if (hasSports) return "Dựa trên môn bạn hay chơi";
    if (hasLocation) return "Sân gần bạn";
    return "Sân phổ biến";
  };

  const handleSearch = (params: { location: string; sportId: string; date: string }) => {
    const p = new URLSearchParams();
    if (params.location) p.set("Keyword", params.location);
    if (params.sportId) p.set("SportId", params.sportId);
    router.push(`/venues${p.toString() ? `?${p.toString()}` : ""}`);
  };

  const handleLocationResolved = (loc: LocationState) => {
    setLocation(loc);
    setShowLocationCard(false);
  };

  const handleSkipLocation = () => {
    setShowLocationCard(false);
  };

  const handleSaveSports = async (sportIds: number[]) => {
    // TODO: call addMySport for each selected sport
    const names = availableSports
      .filter((s) => sportIds.includes(s.id))
      .map((s) => s.name);
    setUserSports((prev) => [...new Set([...prev, ...names])]);
    setShowSportCard(false);
  };

  const handleSkipSports = () => {
    setShowSportCard(false);
  };

  return (
    <>
      {/* Hero */}
      <DiscoveryHero
        userName={user.fullName}
        userSports={userSports}
        onSearch={handleSearch}
      />

      <main className="flex-1">
        {/* Inline setup cards */}
        {(showLocationCard || showSportCard) && (
          <section className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
              {showSportCard && (
                <PersonalizationCard
                  availableSports={availableSports}
                  onSave={handleSaveSports}
                  onSkip={handleSkipSports}
                />
              )}
              {showLocationCard && (
                <LocationConsentCard
                  onLocationResolved={handleLocationResolved}
                  onSkip={handleSkipLocation}
                />
              )}
            </div>
          </section>
        )}

        {/* Recommended venues */}
        <RecommendedVenuesSection
          venues={venues}
          subtitle={getSubtitle()}
          isLoading={venuesLoading}
          onChangeLocation={showLocationCard ? undefined : () => setShowLocationCard(true)}
        />

        {/* Active matches */}
        <ActiveMatchesSection
          matches={matches}
          isLoading={matchesLoading}
        />

        {/* Sports categories */}
        <SportsCategories />
      </main>

      {/* Mobile bottom nav */}
      <PlayerBottomNav />
      <div className="h-14 md:hidden" />
    </>
  );
}
