export interface SportCategory {
  id: string;
  name: string;
  icon: string;
  courtCount: number;
}

export const sports: SportCategory[] = [
  { id: "football", name: "Bóng đá", icon: "football", courtCount: 128 },
  { id: "tennis", name: "Quần vợt", icon: "tennis", courtCount: 64 },
  { id: "badminton", name: "Cầu lông", icon: "badminton", courtCount: 96 },
  { id: "basketball", name: "Bóng rổ", icon: "basketball", courtCount: 42 },
  { id: "volleyball", name: "Bóng chuyền", icon: "volleyball", courtCount: 35 },
  { id: "padel", name: "Padel", icon: "padel", courtCount: 18 },
];
