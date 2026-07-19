"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth-context";
import { addMySport, getMyProfile, getMySports, getSportsOptions } from "@/lib/api/profile";
import { searchVenues, getRecommendedMatches } from "@/lib/api/discovery";
import { sortVenuesByDistance } from "@/lib/utils/player-flow";
import {
  getRecommendationState,
  type LocationState,
  type DiscoveryVenue,
  type DiscoveryMatch,
} from "@/lib/types/discovery";
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
  const [userSports, setUserSports] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationState>({ source: null });
  const [showLocationCard, setShowLocationCard] = useState(false);
  const [showSportCard, setShowSportCard] = useState(false);
  const [availableSports, setAvailableSports] = useState<{ id: number; name: string }[]>([]);
  const [venues, setVenues] = useState<DiscoveryVenue[]>([]);
  const [matches, setMatches] = useState<DiscoveryMatch[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const venueRequestToken = useRef(0);
  const router = useRouter();

  // Load profile + sports on mount (useCallback avoids setState-in-effect lint error)
  const loadProfile = useCallback(async () => {
    try {
      const [profile, mySports, allSports] = await Promise.all([
        getMyProfile().catch(() => null),
        getMySports().catch(() => []),
        getSportsOptions().catch(() => []),
      ]);

      const sportNames = mySports.map((s) => s.sportName);
      setUserSports(sportNames);
      setAvailableSports(allSports.map((s) => ({ id: s.id, name: s.name })));

      const hasLocation = !!profile?.city;
      if (profile?.city) {
        setLocation({ city: profile.city, source: "profile" });
      }

      // Determine recommendation state and show inline cards
      const recState = getRecommendationState(sportNames.length > 0, hasLocation);
      setShowLocationCard(recState === "B" || recState === "D");
      setShowSportCard(recState === "C" || recState === "D");
    } catch {
      // Profile fetch failed, continue with empty state
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load venues from real API
  useEffect(() => {
    let cancelled = false;
    const token = ++venueRequestToken.current;
    setVenuesLoading(true);
    searchVenues({ pageIndex: 1, pageSize: 6 })
      .then((result) => {
        if (!cancelled && token === venueRequestToken.current) setVenues(result.items);
      })
      .catch(() => {
        if (!cancelled && token === venueRequestToken.current) setVenues([]);
      })
      .finally(() => {
        if (!cancelled && token === venueRequestToken.current) setVenuesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Load matches from real API
  useEffect(() => {
    let cancelled = false;
    setMatchesLoading(true);
    getRecommendedMatches(6)
      .then((items) => {
        if (!cancelled) setMatches(items);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setMatchesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Subtitle for recommended section
  const getSubtitle = () => {
    if (location.lat != null && location.lng != null) return "Gần bạn nhất trong các kết quả đã tải (tối đa 50 sân).";
    return "Sân phổ biến";
  };

  const handleSearch = (params: { keyword: string; sportId: string }) => {
    const p = new URLSearchParams();
    if (params.keyword) p.set("Keyword", params.keyword);
    if (params.sportId) p.set("SportId", params.sportId);
    router.push(`/venues${p.toString() ? `?${p.toString()}` : ""}`);
  };

  const handleLocationResolved = async (loc: LocationState) => {
    if (loc.lat == null || loc.lng == null) return;
    const token = ++venueRequestToken.current;
    setVenuesLoading(true);
    try {
      const result = await searchVenues({ pageIndex: 1, pageSize: 50 });
      if (token !== venueRequestToken.current) return;
      setVenues(sortVenuesByDistance(result.items, {
        latitude: loc.lat,
        longitude: loc.lng,
      }).slice(0, 6));
      setLocation(loc);
      setShowLocationCard(false);
    } finally {
      if (token === venueRequestToken.current) setVenuesLoading(false);
    }
  };

  const handleSkipLocation = () => {
    venueRequestToken.current += 1;
    setVenuesLoading(false);
    setShowLocationCard(false);
  };

  const handleSaveSports = async (sportIds: number[]) => {
    const existingIds = new Set((await getMySports()).map((sport) => sport.sportId));
    for (const sportId of sportIds) {
      if (!existingIds.has(sportId)) {
        await addMySport({ sportId, skillLevel: 0 });
        existingIds.add(sportId);
      }
    }
    const refreshed = await getMySports();
    setUserSports(refreshed.map((sport) => sport.sportName));
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
        availableSports={availableSports}
        onSearch={handleSearch}
      />

      <main className="flex-1">
        {/* Inline setup cards */}
        {showSportCard && (
          <section className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
              {showSportCard && (
                <PersonalizationCard
                  availableSports={availableSports}
                  onSave={handleSaveSports}
                  onSkip={handleSkipSports}
                />
              )}
            </div>
          </section>
        )}

        <LocationConsentCard isOpen={showLocationCard} onLocationResolved={handleLocationResolved} onSkip={handleSkipLocation} />

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
