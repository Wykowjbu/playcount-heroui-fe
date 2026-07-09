"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Skeleton,
  Link,
  Separator,
  Select,
  Label,
  ListBox,
  DateField,
  DatePicker,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import type { Key } from "@heroui/react";
import {
  Magnifier,
  MapPin,
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowRight,
  Star,
  Clock,
  Persons,
  Person,
  CircleCheck,
  PersonPlus,
  CreditCard,
  Headphones,
} from "@gravity-ui/icons";
import { courts } from "../../mocks/courts";
import { matches } from "../../mocks/matches";
import { sports } from "../../mocks/sports";
import { SportsCategories } from "./sports-categories";

/* -- Toggle flags for testing -- */
const isLoading = false;
const isEmpty = false;

/* -- Helper: format price -- */
function formatPrice(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

/* -- Helper: sport -> gradient class -- */
function sportGradient(sport: string): string {
  const map: Record<string, string> = {
    "Bóng đá": "from-emerald-500 to-emerald-700",
    "Quần vợt": "from-yellow-500 to-amber-600",
    "Cầu lông": "from-sky-500 to-blue-600",
    "Bóng rổ": "from-orange-500 to-red-600",
    "Bóng chuyền": "from-violet-500 to-purple-700",
    Padel: "from-pink-500 to-rose-600",
  };
  return map[sport] || "from-gray-500 to-gray-700";
}

/* -- Sport icon mapper -- */
function sportIcon(name: string, className = "w-5 h-5") {
  const map: Record<string, React.ReactNode> = {
    "Bóng đá": <CircleCheck className={className} />,
    "Quần vợt": <CircleCheck className={className} />,
    "Cầu lông": <CircleCheck className={className} />,
    "Bóng rổ": <CircleCheck className={className} />,
    "Bóng chuyền": <CircleCheck className={className} />,
    Padel: <CircleCheck className={className} />,
  };
  return map[name] || <CircleCheck className={className} />;
}

/* -- Star Rating -- */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "fill-current" : "opacity-30"}`}
        />
      ))}
      <span className="ml-1 text-xs text-muted font-medium">{rating}</span>
    </span>
  );
}

/* ============================================================
   HERO (Public)
   ============================================================ */
function PublicHero() {
  const [selectedSport, setSelectedSport] = useState<Key | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);

  return (
    <section className="relative bg-gradient-to-br from-accent via-accent/90 to-indigo-600 text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Tìm và đặt sân thể thao{" "}
            <span className="text-amber-300">dễ dàng</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-xl mx-auto">
            Kết nối với cộng đồng thể thao, tìm kiếm đối thủ phù hợp và trải
            nghiệm việc đặt sân chưa bao giờ dễ dàng đến thế.
          </p>
        </div>

        <div className="mt-10 max-w-4xl mx-auto">
          <Card className="bg-white text-foreground shadow-xl rounded-2xl">
            <Card.Content className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 border border-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/40">
                  <MapPin className="w-4 h-4 text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Địa điểm..."
                    className="w-full bg-transparent outline-none text-sm placeholder:text-muted"
                    aria-label="Địa điểm"
                  />
                </div>
                <Select
                  placeholder="Môn thể thao"
                  selectedKey={selectedSport}
                  onSelectionChange={(key) => setSelectedSport(key)}
                >
                  <Label className="sr-only">Môn thể thao</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {sports.map((s) => (
                        <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                          {s.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <DatePicker value={selectedDate} onChange={setSelectedDate}>
                  <Label className="sr-only">Chọn ngày</Label>
                  <DateField.Group>
                    <DateField.Input>
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                      <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                </DatePicker>
                <Link href="#search">
                  <Button variant="primary" size="lg" className="md:px-8">
                    <Magnifier className="w-4 h-4 mr-1" />
                    Tìm sân
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   COURT LISTINGS (Public)
   ============================================================ */
function CourtCard({ court }: { court: (typeof courts)[number] }) {
  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <Card.Content className="p-0">
        <div
          className={`relative h-44 bg-gradient-to-br ${sportGradient(court.sport)} rounded-t-xl flex items-center justify-center`}
        >
          <span className="text-white/60 scale-[2]">
            {sportIcon(court.sport, "w-8 h-8")}
          </span>
          {!court.available && (
            <div className="absolute inset-0 bg-black/50 rounded-t-xl flex items-center justify-center">
              <Chip variant="primary" color="danger" size="sm">
                Hết chỗ
              </Chip>
            </div>
          )}
          <Chip
            variant="primary"
            color="accent"
            size="sm"
            className="absolute top-2 left-2 bg-white/90 text-foreground"
          >
            {court.sport}
          </Chip>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-base group-hover:text-accent transition-colors">
            {court.name}
          </h3>
          <p className="text-xs text-muted mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {court.location}
          </p>
          <div className="mt-2">
            <Stars rating={court.rating} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {court.amenities.map((a) => (
              <Chip key={a} variant="secondary" size="sm" className="text-xs">
                {a}
              </Chip>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            <span className="text-accent font-bold text-lg">
              {formatPrice(court.pricePerHour)}
              <span className="text-xs font-normal text-muted"> /giờ</span>
            </span>
            <Link href="#book">
              <Button variant="primary" size="sm" isDisabled={!court.available}>
                Đặt sân
              </Button>
            </Link>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function CourtSkeleton() {
  return (
    <Card>
      <Card.Content className="p-0">
        <Skeleton className="h-44 rounded-t-xl w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-8 w-full rounded mt-4" />
        </div>
      </Card.Content>
    </Card>
  );
}

function CourtListings() {
  return (
    <section id="courts" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Sân nổi bật</h2>
            <p className="text-muted mt-1">Được cộng đồng tin tưởng</p>
          </div>
          <Link href="#courts">
            <Button variant="outline" size="sm">
              Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <CourtSkeleton key={i} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20 text-muted">
            <Magnifier className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Không tìm thấy sân</p>
            <p className="text-sm mt-1">Hãy thử thay đổi bộ lọc của bạn</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <CourtCard key={court.id} court={court} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   MATCHES (Public)
   ============================================================ */
function MatchCard({ match }: { match: (typeof matches)[number] }) {
  const spotsLeft = match.playersNeeded;
  const isFull = spotsLeft === 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Card.Content className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Chip variant="secondary" size="sm" className="text-xs">
                {match.sport}
              </Chip>
              <Chip
                variant="secondary"
                size="sm"
                className="text-xs"
                color={isFull ? "default" : "success"}
              >
                {isFull ? "Đầy" : `Còn ${spotsLeft} chỗ`}
              </Chip>
            </div>
            <h3 className="font-semibold mt-2 text-sm md:text-base truncate">
              {match.title}
            </h3>
            <p className="text-xs text-muted mt-1 flex items-center gap-1">
              <Person className="w-3 h-3" /> {match.hostName}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" /> {match.location}
          </p>
          <p className="flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3 shrink-0" /> {match.date}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" /> {match.time}
          </p>
          <p className="flex items-center gap-1.5">
            <Persons className="w-3 h-3 shrink-0" /> {match.playersCurrent}/{match.playersCurrent + spotsLeft} người
            · {match.skillLevel}
          </p>
        </div>

        <div className="mt-4">
          <Link href="#join">
            <Button
              variant={isFull ? "outline" : "primary"}
              size="sm"
              className="w-full"
              isDisabled={isFull}
            >
              <PersonPlus className="w-4 h-4 mr-1" />
              {isFull ? "Đầy" : "Tham gia"}
            </Button>
          </Link>
        </div>
      </Card.Content>
    </Card>
  );
}

function MatchesSection() {
  return (
    <section id="matches" className="py-16" style={{ background: "var(--surface-secondary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Tìm đối thủ</h2>
            <p className="text-muted mt-1">
              Tham gia các trận đấu hoặc tạo trận mới
            </p>
          </div>
          <Link href="#matches">
            <Button variant="outline" size="sm">
              Xem thêm <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA -- FOR COURT OWNERS
   ============================================================ */
function CTASection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-indigo-600 to-accent rounded-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-x-1/4 translate-y-1/4" />

          <div className="relative px-8 py-14 md:px-16 md:py-20 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-white">
              <h2 className="text-2xl md:text-3xl font-bold">
                Sở hữu sân thể thao?
              </h2>
              <p className="mt-3 text-white/80 max-w-lg">
                Tiếp cận hàng ngàn khách hàng tiềm năng. Quản lý lịch đặt sân,
                thanh toán và báo cáo — tất cả trong một nền tảng duy nhất.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register/owner">
                  <Button variant="primary" size="lg"
                    className="bg-white text-accent hover:bg-white/90">
                    Đăng ký ngay <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="#learn-more">
                  <Button variant="ghost" size="lg"
                    className="text-white border-white/30 hover:bg-white/10">
                    Tìm hiểu thêm
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0">
              {[
                { label: "Sân đăng ký", value: "500+" },
                { label: "Lượt đặt/tháng", value: "12K+" },
                { label: "Đánh giá TB", value: "4.8" },
                { label: "Tỷ lệ hài lòng", value: "96%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center"
                >
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WHY CHOOSE SECTION
   ============================================================ */
function WhyChooseSection() {
  const features = [
    {
      icon: <Magnifier className="w-6 h-6" />,
      title: "Tìm kiếm thông minh",
      desc: "Tìm sân theo vị trí, môn thể thao, giá cả và thời gian trống một cách nhanh chóng.",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Thanh toán dễ dàng",
      desc: "Đa dạng phương thức thanh toán: QR, ví điện tử, thẻ ngân hàng. An toàn và bảo mật.",
    },
    {
      icon: <Persons className="w-6 h-6" />,
      title: "Cộng đồng thể thao",
      desc: "Kết nối với người chơi cùng đam mê, tìm đối thủ phù hợp ở mọi trình độ.",
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Hỗ trợ 24/7",
      desc: "Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc của bạn.",
    },
  ];

  return (
    <section id="why" className="py-16" style={{ background: "var(--surface-secondary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Tại sao chọn PlayCourt?
        </h2>
        <p className="text-muted text-center mt-2 max-w-lg mx-auto">
          Nền tảng đặt sân thể thao hàng đầu Việt Nam
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow text-center">
              <Card.Content className="p-6 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  {f.desc}
                </p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
              <span className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center text-sm font-bold">
                PC
              </span>
              PlayCourt
            </Link>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Nền tảng đặt sân thể thao thông minh, kết nối cộng đồng người
              chơi thể thao Việt Nam.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Khám phá</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#courts" className="hover:text-accent transition-colors">Tìm sân</Link></li>
              <li><Link href="#matches" className="hover:text-accent transition-colors">Tìm đối</Link></li>
              <li><Link href="#sports" className="hover:text-accent transition-colors">Môn thể thao</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#faq" className="hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link href="#contact" className="hover:text-accent transition-colors">Liên hệ</Link></li>
              <li><Link href="#terms" className="hover:text-accent transition-colors">Điều khoản</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Doanh nghiệp</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register/owner" className="hover:text-accent transition-colors">Đăng ký sân</Link></li>
              <li><Link href="#partners" className="hover:text-accent transition-colors">Đối tác</Link></li>
              <li><Link href="#careers" className="hover:text-accent transition-colors">Tuyển dụng</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; 2026 PlayCourt. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#privacy" className="hover:text-gray-300">Chính sách bảo mật</Link>
            <Link href="#terms" className="hover:text-gray-300">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   EXPORT: PublicLandingView
   ============================================================ */
export function PublicLandingView() {
  return (
    <>
      <main className="flex-1">
        <PublicHero />
        <SportsCategories />
        <CourtListings />
        <MatchesSection />
        <CTASection />
        <WhyChooseSection />
      </main>
      <Footer />
    </>
  );
}
