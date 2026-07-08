export interface Match {
  id: string;
  title: string;
  sport: string;
  location: string;
  date: string;
  time: string;
  playersNeeded: number;
  playersCurrent: number;
  skillLevel: string;
  hostName: string;
}

export const matches: Match[] = [
  {
    id: "1",
    title: "Giao hữu bóng đá cuối tuần",
    sport: "Bóng đá",
    location: "Sân Mini Zena, Quận 7",
    date: "Thứ 7, 12/07",
    time: "18:00 - 20:00",
    playersNeeded: 4,
    playersCurrent: 8,
    skillLevel: "Trung bình",
    hostName: "Minh Tuấn",
  },
  {
    id: "2",
    title: "Tennis đôi nam/nữ",
    sport: "Quần vợt",
    location: "Park Royal, Quận 1",
    date: "Chủ nhật, 13/07",
    time: "07:00 - 09:00",
    playersNeeded: 2,
    playersCurrent: 2,
    skillLevel: "Nâng cao",
    hostName: "Thanh Hà",
  },
  {
    id: "3",
    title: "Cầu lông giải nội bộ",
    sport: "Cầu lông",
    location: "StarBadminton, Thủ Đức",
    date: "Thứ 4, 09/07",
    time: "19:00 - 21:00",
    playersNeeded: 6,
    playersCurrent: 10,
    skillLevel: "Mọi trình độ",
    hostName: "Hoàng Nam",
  },
];
