"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyProfile } from "@/lib/api/profile";
import type { UserProfileResponseDto } from "@/lib/types/profile";
import { Alert, Card, CardContent } from "@heroui/react";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { ProfilePersonalForm } from "./ProfilePersonalForm";
import { PlayerSportsPanel } from "./PlayerSportsPanel";
import { OwnerBusinessPanel } from "./OwnerBusinessPanel";
import { Tabs } from "@heroui/react";
import Person from "@gravity-ui/icons/Person";
import Star from "@gravity-ui/icons/Star";
import Lock from "@gravity-ui/icons/Lock";

interface Props {
  role: "player" | "owner";
}

export function ProfilePageShell({ role }: Props) {
  const [profile, setProfile] = useState<UserProfileResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("personal");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Không thể tải hồ sơ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return <ProfilePageShellLoading />;
  }

  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Lỗi tải hồ sơ</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (!profile) return null;

  const tabs = role === "player"
    ? [
        { id: "personal", label: "Cá nhân", icon: Person },
        { id: "sports", label: "Môn thể thao", icon: Star },
        { id: "security", label: "Bảo mật", icon: Lock },
      ]
    : [
        { id: "personal", label: "Cá nhân", icon: Person },
        { id: "business", label: "Kinh doanh", icon: Star },
      ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Summary Card - 320px on desktop */}
      <div className="w-full lg:w-[320px] shrink-0">
        <ProfileSummaryCard profile={profile} onProfileUpdate={setProfile} role={role} />
      </div>

      {/* Right: Profile Card - flex-1, max ~760px */}
      <div className="flex-1 min-w-0 lg:max-w-[760px]">
        <Card className="!h-auto !min-h-0 border border-border bg-[var(--surface)]">
          <CardContent className="p-5 sm:p-6 lg:p-7">
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)}>
            <Tabs.ListContainer>
              <Tabs.List aria-label="Hồ sơ">
                {tabs.map((tab) => (
                  <Tabs.Tab key={tab.id} id={tab.id}>
                    <span className="flex items-center gap-1.5">
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>

            <div className="pt-5">
              <Tabs.Panel id="personal">
                <ProfilePersonalForm profile={profile} onProfileUpdate={setProfile} />
              </Tabs.Panel>

              {role === "player" && (
                <Tabs.Panel id="sports">
                  <PlayerSportsPanel />
                </Tabs.Panel>
              )}

              {role === "owner" && (
                <Tabs.Panel id="business">
                  <OwnerBusinessPanel profile={profile} />
                </Tabs.Panel>
              )}

              {role === "player" && <Tabs.Panel id="security">
                <div className="max-w-[640px]">
                  <div
                    className="rounded-xl border border-border p-5"
                    style={{ background: "var(--surface-secondary)" }}
                  >
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Đổi mật khẩu</h3>
                        <p className="text-sm text-muted mt-1">
                          Tính năng đổi mật khẩu sẽ được xử lý ở phần cài đặt bảo mật.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.Panel>}
            </div>
          </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfilePageShellLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[320px] shrink-0">
        <div
          className="rounded-2xl border border-border p-6 space-y-4"
          style={{ background: "var(--surface)" }}
        >
          <div className="mx-auto w-[72px] h-[72px] rounded-full" style={{ background: "var(--surface-secondary)" }} />
          <div className="h-4 w-3/5 mx-auto rounded-lg" style={{ background: "var(--surface-secondary)" }} />
          <div className="h-3 w-2/5 mx-auto rounded-lg" style={{ background: "var(--surface-secondary)" }} />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-full rounded-lg" style={{ background: "var(--surface-secondary)" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 lg:max-w-[760px]">
        <div
          className="rounded-2xl border border-border p-5 sm:p-6 lg:p-7 space-y-4"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg" style={{ background: "var(--surface-secondary)" }} />
            ))}
          </div>
          <div className="max-w-[640px] space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 w-full rounded-lg" style={{ background: "var(--surface-secondary)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
