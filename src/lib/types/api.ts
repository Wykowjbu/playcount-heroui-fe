/* ------------------------------------------------------------------ */
/* COMPREHENSIVE API TYPES — mirrors BE DTOs (camelCase JSON)         */
/* ------------------------------------------------------------------ */

/* ================================================================ */
/* AUTH                                                               */
/* ================================================================ */

export interface LoginRequestDto {
  identifier: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserSummaryDto;
}

export interface RegisterRequestDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: string;
  businessName?: string;
}

export interface RegisterResponseDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  businessName: string | null;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutRequestDto {
  refreshToken: string;
}

export interface VerifyEmailRequestDto {
  email: string;
  otp: string;
}

export interface ResendVerifyEmailRequestDto {
  email: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

/* ================================================================ */
/* USER — re-export from profile.ts (source of truth)                */
/* ================================================================ */
export type {
  UserProfileResponseDto,
  UpdateUserProfileRequestDto,
  PlayerSportResponseDto,
  AddPlayerSportRequestDto,
  UpdatePlayerSportRequestDto,
  CourtOwnerProfileSummaryDto,
  SportOption,
} from "./profile";

export interface UserSummaryDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
}

/* ================================================================ */
/* VENUE                                                              */
/* ================================================================ */

export interface VenueSearchRequestDto {
  keyword?: string;
  sportId?: number;
  isOpenNow?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface VenueResponseDto {
  id: number;
  courtOwnerProfileId: number;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  openTime: string | null;
  closeTime: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  images: VenueImageDto[];
  amenities: VenueAmenityDto[];
  openingHours: OpeningHourDto[];
}

export interface VenueImageDto {
  id: number;
  imageUrl: string;
  isCover: boolean;
  createdAt?: string;
}

export interface VenueAmenityDto {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface OpeningHourDto {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface CreateVenueRequestDto {
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export interface UpdateVenueRequestDto {
  name: string;
  description?: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  openTime?: string | null;
  closeTime?: string | null;
}

export interface AddVenueImageRequestDto {
  imageUrl: string;
  isCover?: boolean;
}

export interface UpdateVenueStatusRequestDto {
  status: 0 | 1 | 2 | 3;
}

export interface UpdateOpeningHoursRequestDto {
  openingHours: OpeningHourDto[];
}

/* ================================================================ */
/* COURT                                                              */
/* ================================================================ */

export interface CourtDto {
  id: number;
  venueId: number;
  name: string;
  sportId: number;
  sportName: string;
  indoor: boolean;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCourtRequestDto {
  name: string;
  sportId: number;
  indoor: boolean;
}

export interface UpdateCourtRequestDto {
  name: string;
  sportId: number;
  indoor: boolean;
  status: string;
}

/* ================================================================ */
/* BOOKING                                                            */
/* ================================================================ */

export interface CreateBookingRequestDto {
  courtId: number;
  startAt: string;
  endAt: string;
  note?: string;
}

export interface BookingResponseDto {
  id: number;
  courtId: number;
  courtName: string;
  venueId: number;
  venueName: string;
  userProfileId: number;
  playerName: string;
  startAt: string;
  endAt: string;
  totalPrice: number;
  platformFee: number;
  ownerEarnings: number;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BookingQueryDto {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingAvailabilityRequestDto {
  startAt: string;
  endAt: string;
}

export interface BookingAvailabilityResponseDto {
  courtId: number;
  startAt: string;
  endAt: string;
  isAvailable: boolean;
  estimatedPrice: number | null;
  reason: string | null;
}

export interface VenueAvailabilitySlotDto {
  startAt: string;
  endAt: string;
  status: "Available" | "Booked" | "Held" | "Maintenance" | "Closed";
  estimatedPrice: number | null;
  canStartBooking: boolean;
}

export interface VenueAvailabilityCourtDto {
  id: number;
  name: string;
  sportId: number;
  sportName: string;
  slots: VenueAvailabilitySlotDto[];
}

export interface VenueAvailabilityResponseDto {
  date: string;
  venue: { id: number; name: string; address: string; openTime: string | null; closeTime: string | null; isClosed: boolean };
  courts: VenueAvailabilityCourtDto[];
}

export interface UpdateBookingStatusRequestDto {
  reason?: string;
}

/* ================================================================ */
/* MATCH                                                              */
/* ================================================================ */

export interface MatchSearchRequestDto {
  sportId?: number;
  skillLevel?: number;
  location?: string;
  startFrom?: string;
  startTo?: string;
  includeFull?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface MatchResponseDto {
  id: number;
  hostProfileId: number;
  hostName: string;
  hostAvatarUrl: string | null;
  sportId: number;
  sportCode: string;
  sportName: string;
  courtId: number | null;
  courtName: string | null;
  venueName: string | null;
  locationDescription: string | null;
  startAt: string;
  endAt: string;
  requiredSkillLevelMin: string | null;
  requiredSkillLevelMax: string | null;
  maxParticipants: number;
  participantCount: number;
  availableSlots: number;
  costDescription: string | null;
  description: string | null;
  status: string;
  isHost: boolean;
  isParticipant: boolean;
  myJoinRequestStatus: string | null;
  participants?: MatchParticipantDto[];
  createdAt: string;
}

export interface MatchParticipantDto {
  profileId: number;
  fullName: string;
  avatarUrl: string | null;
  skillLevel: string | null;
  isHost: boolean;
  joinedAt: string;
}

export interface CreateMatchRequestDto {
  sportId: number;
  courtId?: number;
  locationDescription?: string;
  startAt: string;
  endAt: string;
  requiredSkillLevelMin?: number;
  requiredSkillLevelMax?: number;
  maxParticipants: number;
  costDescription?: string;
  description?: string;
}

export interface UpdateMatchRequestDto {
  startAt?: string;
  endAt?: string;
  requiredSkillLevelMin?: number;
  requiredSkillLevelMax?: number;
  maxParticipants?: number;
  costDescription?: string;
  description?: string;
  locationDescription?: string;
}

export interface RespondJoinRequestDto {
  status: string; // "Approved" | "Rejected"
}

export interface MatchJoinRequestDto {
  id: number;
  matchId: number;
  userId: number;
  userName: string;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
}

export interface MatchCandidateDto {
  profileId: number;
  fullName: string;
  avatarUrl: string | null;
  city: string | null;
  skillLevel: string | null;
  matchScore: number;
}

export interface CreateMatchInvitationDto {
  inviteeProfileId: number;
  message?: string;
}

export interface MatchInvitationDto {
  id: number;
  matchId: number;
  sportName: string;
  matchStartAt: string;
  inviterProfileId: number;
  inviterName: string;
  inviteeProfileId: number;
  inviteeName: string;
  message: string | null;
  status: string;
  invitedAt: string;
  respondedAt: string | null;
}

export interface RespondMatchInvitationDto {
  status: string; // "Accepted" | "Declined"
}

/* ================================================================ */
/* PAYMENT                                                            */
/* ================================================================ */

export interface PaymentDto {
  id: number;
  bookingId: number | null;
  amount: number;
  provider: string;
  status: string;
  transactionCode: string | null;
  type: string;
  currency: string;
  note: string | null;
  createdAt: string;
  paidAt: string | null;
  updatedAt: string | null;
}

/* ================================================================ */
/* NOTIFICATION                                                       */
/* ================================================================ */

export interface NotificationQueryDto {
  type?: string;
  isRead?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface NotificationDto {
  id: number;
  type: string;
  title: string;
  content: string | null;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

/* ================================================================ */
/* REVIEW                                                             */
/* ================================================================ */

export interface CreateReviewRequestDto {
  bookingId: number;
  rating: number;
  reviewText?: string;
  imageUrls?: string[];
}

export interface ReviewResponseDto {
  id: number;
  playerId: number;
  playerName: string;
  playerAvatar: string | null;
  bookingId: number;
  venueId: number;
  venueName: string;
  courtId: number;
  courtName: string;
  rating: number;
  reviewText: string | null;
  status: string;
  images: ReviewImageDto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface ReviewImageDto {
  id: number;
  reviewId: number;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
}

export interface UpdateReviewRequestDto {
  rating: number;
  reviewText?: string;
}

export interface AddReviewImageRequestDto {
  imageUrl: string;
  displayOrder?: number;
}

export interface RatingStatsDto {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

/* ================================================================ */
/* SPORT                                                              */
/* ================================================================ */

export interface SportDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  playerCount: number | null;
  isActive: boolean;
  iconUrl?: string;
  createdAt: string;
}

export interface CreateSportRequestDto {
  code: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface UpdateSportRequestDto {
  code?: string;
  name?: string;
  description?: string;
  iconUrl?: string;
}

/* ================================================================ */
/* AMENITY                                                            */
/* ================================================================ */

export interface AmenityDto {
  id: number;
  name: string;
}

export interface CreateAmenityRequestDto {
  name: string;
  description?: string;
  iconUrl?: string;
}

/* ================================================================ */
/* COURT OWNER                                                        */
/* ================================================================ */

export interface CourtOwnerListItemDto {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  businessName: string;
  verificationStatus: string;
  createdAt: string;
}

export interface CourtOwnerDetailDto extends CourtOwnerListItemDto {
  userProfileId: number;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  businessLicenseNo: string | null;
  taxCode: string | null;
  businessAddress: string | null;
  rejectionReason: string | null;
  updatedAt: string | null;
}

export interface UpdateCourtOwnerVerificationStatusRequestDto {
  verificationStatus: 1 | 2;
  rejectionReason?: string;
}

/* ================================================================ */
/* PRICING RULE                                                       */
/* ================================================================ */

export interface PricingRuleDto {
  id: number;
  courtId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
}

export interface CreatePricingRuleRequestDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpdatePricingRuleRequestDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

/* ================================================================ */
/* COURT SCHEDULE                                                     */
/* ================================================================ */

export interface CourtScheduleDto {
  id: number;
  courtId: number;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdAt: string;
}

export interface CreateCourtScheduleRequestDto {
  startAt: string;
  endAt: string;
  reason?: string;
}

/* ================================================================ */
/* VENUE STAFF                                                        */
/* ================================================================ */

export interface VenueStaffResponseDto {
  id: number;
  venueId: number;
  venueName: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AddVenueStaffRequestDto {
  email: string;
  role: string;
}

/* ================================================================ */
/* OWNER STATS                                                        */
/* ================================================================ */

export interface OwnerStatsDto {
  totalVenues: number;
  totalCourts: number;
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
  totalRevenue: number;
  activeVenues: number;
}
