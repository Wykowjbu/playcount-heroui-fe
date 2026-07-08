export interface Court {
  id: string;
  name: string;
  sport: string;
  location: string;
  rating: number;
  pricePerHour: number;
  image: string;
  amenities: string[];
  available: boolean;
}

export const courts: Court[] = [
  {
    id: "1",
    name: "Sân bóng đá Mini Zena",
    sport: "Bóng đá",
    location: "Quận 7, TP.HCM",
    rating: 4.8,
    pricePerHour: 200000,
    image: "",
    amenities: ["Đèn floodlight", "Phòng thay đồ", "Nước uống"],
    available: true,
  },
  {
    id: "2",
    name: "Tennis Court Park Royal",
    sport: "Quần vợt",
    location: "Quận 1, TP.HCM",
    rating: 4.6,
    pricePerHour: 150000,
    image: "",
    amenities: ["Sân cứng", "Cho thuê vợt", "Bãi đậu xe"],
    available: true,
  },
  {
    id: "3",
    name: "Sân cầu lông StarBadminton",
    sport: "Cầu lông",
    location: "Thủ Đức, TP.HCM",
    rating: 4.9,
    pricePerHour: 80000,
    image: "",
    amenities: ["8 sân", "Điều hòa", "Quầy đồ ăn"],
    available: true,
  },
  {
    id: "4",
    name: "Basketball Arena D1",
    sport: "Bóng rổ",
    location: "Quận 1, TP.HCM",
    rating: 4.5,
    pricePerHour: 120000,
    image: "",
    amenities: ["Sân trong nhà", "Khán đài", "Âm thanh"],
    available: false,
  },
  {
    id: "5",
    name: "Sân bóng chuyền Sun Beach",
    sport: "Bóng chuyền",
    location: "Quận 2, TP.HCM",
    rating: 4.3,
    pricePerHour: 100000,
    image: "",
    amenities: ["Sân cát", "Dã ngoại BBQ", "Bãi biển gần"],
    available: true,
  },
  {
    id: "6",
    name: "Padel Court Premium",
    sport: "Padel",
    location: "Quận 3, TP.HCM",
    rating: 4.7,
    pricePerHour: 250000,
    image: "",
    amenities: ["Sân kính", "Hệ thống chiếu sáng LED", "Quầy nước"],
    available: true,
  },
];
