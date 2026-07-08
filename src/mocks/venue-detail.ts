export interface Amenity {
  icon: string;
  label: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: "available" | "booked";
}

export interface CourtDetail {
  id: string;
  name: string;
  sport: string;
  type: "indoor" | "outdoor";
  status: "available" | "maintenance";
  pricePerHour: number;
  timeSlots: TimeSlot[];
}

export interface RatingStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface VenueDetail {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  status: "approved" | "pending";
  isOpen: boolean;
  images: string[];
  amenities: Amenity[];
  description: string;
  openingHours: string[];
  rules: string[];
}

export const venueDetail: VenueDetail = {
  id: "1",
  name: "SÂN BÓNG ĐÁ CHẢO LỬA",
  address: "30 Đào Duy Anh, P9, Phú Nhuận, TP.HCM",
  phone: "0909123456",
  rating: 4.8,
  reviewCount: 124,
  status: "approved",
  isOpen: true,
  images: [
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80",
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80",
  ],
  amenities: [
    { icon: "Signal", label: "Wifi miễn phí" },
    { icon: "Car", label: "Bãi đậu ô tô" },
    { icon: "Cup", label: "Căn tin" },
    { icon: "Droplet", label: "Nước uống miễn phí" },
    { icon: "House", label: "Phòng thay đồ" },
    { icon: "Flame", label: "Đèn chiếu sáng" },
  ],
  description:
    "Sân bóng đá mini tiêu chuẩn với hệ thống đèn LED hiện đại, mặt cỏ nhân tạo cao cấp. Phù hợp cho các trận đấu 5 người và 7 người.",
  openingHours: [
    "Thứ 2 - Thứ 6: 06:00 - 22:00",
    "Thứ 7 - Chủ nhật: 05:30 - 23:00",
    "Ngày lễ: 06:00 - 22:00",
  ],
  rules: [
    "Mang giày đế turf hoặc đinh tán mềm khi thi đấu",
    "Không hút thuốc trong khuôn viên sân",
    "Giữ gìn vệ sinh chung, vứt rác đúng nơi quy định",
    "Không mang thức ăn có cồn vào sân",
    "Đặt sân trước ít nhất 1 giờ, hủy trước 2 giờ để được hoàn tiền",
    "Tuân thủ giờ đặt, đến trễ quá 15 phút có thể bị hủy slot",
  ],
};

export const courts: CourtDetail[] = [
  {
    id: "c1",
    name: "Sân 5A",
    sport: "Bóng đá",
    type: "indoor",
    status: "available",
    pricePerHour: 300000,
    timeSlots: [
      { startTime: "06:00", endTime: "07:00", status: "available" },
      { startTime: "07:00", endTime: "08:00", status: "booked" },
      { startTime: "08:00", endTime: "09:00", status: "available" },
      { startTime: "17:00", endTime: "18:00", status: "available" },
      { startTime: "18:00", endTime: "19:00", status: "booked" },
      { startTime: "19:00", endTime: "20:00", status: "available" },
      { startTime: "20:00", endTime: "21:00", status: "available" },
    ],
  },
  {
    id: "c2",
    name: "Sân 5B",
    sport: "Bóng đá",
    type: "indoor",
    status: "available",
    pricePerHour: 280000,
    timeSlots: [
      { startTime: "06:00", endTime: "07:00", status: "booked" },
      { startTime: "07:00", endTime: "08:00", status: "available" },
      { startTime: "17:00", endTime: "18:00", status: "available" },
      { startTime: "18:00", endTime: "19:00", status: "available" },
      { startTime: "19:00", endTime: "20:00", status: "booked" },
      { startTime: "20:00", endTime: "21:00", status: "available" },
    ],
  },
  {
    id: "c3",
    name: "Sân 7A",
    sport: "Bóng đá",
    type: "outdoor",
    status: "available",
    pricePerHour: 500000,
    timeSlots: [
      { startTime: "06:00", endTime: "07:30", status: "available" },
      { startTime: "07:30", endTime: "09:00", status: "available" },
      { startTime: "17:00", endTime: "18:30", status: "booked" },
      { startTime: "18:30", endTime: "20:00", status: "available" },
      { startTime: "20:00", endTime: "21:30", status: "available" },
    ],
  },
  {
    id: "c4",
    name: "Sân 7B",
    sport: "Bóng đá",
    type: "outdoor",
    status: "maintenance",
    pricePerHour: 500000,
    timeSlots: [],
  },
];

export const ratingStats: RatingStats = {
  average: 4.8,
  total: 124,
  distribution: { 5: 89, 4: 25, 3: 7, 2: 2, 1: 1 },
};

export const reviews: Review[] = [
  {
    id: "r1",
    userName: "Minh Tuấn",
    rating: 5,
    comment:
      "Sân đẹp, cỏ nhân tạo chất lượng cao. Hệ thống đèn LED chiếu sáng tốt vào ban đêm. Giá cả hợp lý, sẽ quay lại!",
    date: "2026-06-28",
  },
  {
    id: "r2",
    userName: "Hoàng Nam",
    rating: 4,
    comment:
      "Vị trí thuận lợi, gần trung tâm. Có bãi đậu xe rộng rãi. Nhân viên nhiệt tình. Tuy nhiên giờ cao điểm hơi đông.",
    date: "2026-06-20",
  },
  {
    id: "r3",
    userName: "Thanh Hằng",
    rating: 5,
    comment:
      "Đặt sân qua app rất tiện lợi. Sân sạch sẽ, có phòng thay đồ và nước uống miễn phí. Recommend cho team building!",
    date: "2026-06-15",
  },
  {
    id: "r4",
    userName: "Đức Trọng",
    rating: 5,
    comment:
      "Chơi ở đây 3 lần rồi, lần nào cũng hài lòng. Mặt sân êm, không bị trơn trượt. Giá cuối tuần hơi cao nhưng bù lại chất lượng.",
    date: "2026-06-10",
  },
  {
    id: "r5",
    userName: "Phương Linh",
    rating: 4,
    comment:
      "Sân ổn, căn tin bán đồ uống và đồ ăn nhẹ. Wifi miễn phí. Có chỗ ngồi chờ cho người đi cùng.",
    date: "2026-05-30",
  },
];
