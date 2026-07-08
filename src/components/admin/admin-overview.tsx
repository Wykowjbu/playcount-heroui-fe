"use client";

import { useState } from "react";
import type { Key } from "@react-types/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  ToggleButtonGroup,
  ToggleButton,
} from "@heroui/react";

import House from "@gravity-ui/icons/House";
import Person from "@gravity-ui/icons/Person";
import Star from "@gravity-ui/icons/Star";
import Bell from "@gravity-ui/icons/Bell";
import PersonGear from "@gravity-ui/icons/PersonGear";
import Tags from "@gravity-ui/icons/Tags";
import Wrench from "@gravity-ui/icons/Wrench";
import Clock from "@gravity-ui/icons/Clock";

import { AdminStatCard } from "./admin-stat-card";
import { AdminPriorityTable } from "./admin-priority-table";

export function AdminOverview() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<Set<Key>>(
    new Set(["7d"]),
  );
  const [selectedTab, setSelectedTab] = useState<Key>("overview");

  return (
    <div className="space-y-6">
      {/* Section 1: Page intro row */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Chào buổi sáng, Admin</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Có 20 mục đang cần Admin kiểm tra. Ưu tiên xử lý hàng chờ.
          </p>
        </div>
        <ToggleButtonGroup
          selectedKeys={selectedTimeRange}
          onSelectionChange={setSelectedTimeRange}
          selectionMode="single"
          disallowEmptySelection
          size="md"
          aria-label="Chọn khoảng thời gian thống kê"
        >
          <ToggleButton id="7d">7 ngày</ToggleButton>
          <ToggleButton id="30d">30 ngày</ToggleButton>
          <ToggleButton id="all">Tất cả</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* Section 2: Dashboard Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        aria-label="Nhóm nội dung tổng quan Admin"
      >
        <TabList>
          <Tab id="overview">Tổng quan</Tab>
          <Tab id="approval">Duyệt hồ sơ</Tab>
          <Tab id="content">Nội dung</Tab>
          <Tab id="categories">Danh mục</Tab>
        </TabList>

        <TabPanel id="overview">
          <div className="space-y-6">
            {/* A. Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminStatCard
                title="Cơ sở chờ duyệt"
                value={12}
                subtitle="+4 trong 7 ngày"
                ctaLabel="Xem danh sách"
                ctaHref="/admin/venues"
                icon={House}
              />
              <AdminStatCard
                title="Chủ sân chờ duyệt"
                value={5}
                subtitle="+2 trong 7 ngày"
                ctaLabel="Xem hồ sơ"
                ctaHref="/admin/court-owners"
                icon={Person}
              />
              <AdminStatCard
                title="Review bị báo cáo"
                value={3}
                subtitle="Cần xử lý sớm"
                ctaLabel="Kiểm duyệt"
                ctaHref="/admin/reviews"
                icon={Star}
              />
              <AdminStatCard
                title="Chưa đọc"
                value={8}
                subtitle="Thông báo mới"
                ctaLabel="Mở thông báo"
                ctaHref="/admin/notifications"
                icon={Bell}
              />
            </div>

            {/* B. Secondary KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminStatCard title="Cơ sở hoạt động" value={48} icon={House} />
              <AdminStatCard title="Cơ sở tạm dừng" value={2} icon={Clock} />
              <AdminStatCard title="Sân bảo trì" value={4} icon={Wrench} />
              <AdminStatCard title="Tài khoản khóa" value={1} icon={Person} />
            </div>

            {/* C. Chart/Insight Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 1: Hàng chờ theo loại */}
              <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-base font-semibold">
                    Hàng chờ theo loại
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {[
                    {
                      label: "Cơ sở chờ duyệt",
                      count: 12,
                      max: 12,
                      color: "var(--warning)",
                    },
                    {
                      label: "Chủ sân chờ duyệt",
                      count: 5,
                      max: 12,
                      color: "var(--accent)",
                    },
                    {
                      label: "Review bị báo cáo",
                      count: 3,
                      max: 12,
                      color: "var(--danger)",
                    },
                    {
                      label: "Thông báo chưa đọc",
                      count: 8,
                      max: 12,
                      color: "var(--muted)",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--muted)] w-36 shrink-0">
                        {item.label}
                      </span>
                      <div className="flex-1 h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.count / item.max) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-6 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-0 pt-4">
                  <Button variant="ghost" size="sm" className="px-0">
                    Đi tới hàng chờ
                  </Button>
                </CardFooter>
              </Card>

              {/* Card 2: Trạng thái cơ sở */}
              <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-base font-semibold">
                    Trạng thái cơ sở
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {[
                    {
                      label: "Đã hoạt động",
                      count: 48,
                      max: 48,
                      color: "var(--success)",
                    },
                    {
                      label: "Chờ duyệt",
                      count: 12,
                      max: 48,
                      color: "var(--warning)",
                    },
                    {
                      label: "Từ chối",
                      count: 6,
                      max: 48,
                      color: "var(--danger)",
                    },
                    {
                      label: "Tạm dừng",
                      count: 2,
                      max: 48,
                      color: "var(--muted)",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--muted)] w-36 shrink-0">
                        {item.label}
                      </span>
                      <div className="flex-1 h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.count / item.max) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-6 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-0 pt-4">
                  <Button variant="ghost" size="sm" className="px-0">
                    Quản lý cơ sở
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* D. Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Duyệt cơ sở mới",
                  subtitle: "Xem danh sách chờ",
                  icon: House,
                  href: "/admin/venues",
                },
                {
                  title: "Xác minh chủ sân",
                  subtitle: "5 hồ sơ chờ",
                  icon: PersonGear,
                  href: "/admin/court-owners",
                },
                {
                  title: "Kiểm duyệt review",
                  subtitle: "3 báo cáo mới",
                  icon: Star,
                  href: "/admin/reviews",
                },
                {
                  title: "Quản lý tiện ích",
                  subtitle: "12 tiện ích",
                  icon: Wrench,
                  href: "/admin/amenities",
                },
              ].map((action) => (
                <Card
                  key={action.title}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-0 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{action.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {action.subtitle}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* E. Priority Queue Table */}
            <AdminPriorityTable />

            {/* F. Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Hoạt động gần đây */}
              <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-base font-semibold">
                    Hoạt động gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {[
                    {
                      text: "Venue ABC gửi hồ sơ mới",
                      time: "2 giờ trước",
                    },
                    {
                      text: "Owner Minh Sport chờ duyệt",
                      time: "5 giờ trước",
                    },
                    { text: "Review #124 bị report", time: "Hôm qua" },
                    { text: "Booking #829 completed", time: "Hôm qua" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <span className="text-sm">{item.text}</span>
                      <span className="text-xs text-[var(--muted)] shrink-0 ml-3">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Danh mục hệ thống */}
              <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-base font-semibold">
                    Danh mục hệ thống
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {[
                    { label: "Môn thể thao", value: "4 active", icon: Tags },
                    {
                      label: "Tiện ích",
                      value: "12 tiện ích",
                      icon: Wrench,
                    },
                    { label: "Cơ sở approved", value: "48", icon: House },
                    { label: "Sân bảo trì", value: "4", icon: Wrench },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-[var(--muted)]" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="approval">
          <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-8 text-center text-[var(--muted)]">
            Nội dung đang được chuẩn bị
          </Card>
        </TabPanel>
        <TabPanel id="content">
          <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-8 text-center text-[var(--muted)]">
            Nội dung đang được chuẩn bị
          </Card>
        </TabPanel>
        <TabPanel id="categories">
          <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-8 text-center text-[var(--muted)]">
            Nội dung đang được chuẩn bị
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}
