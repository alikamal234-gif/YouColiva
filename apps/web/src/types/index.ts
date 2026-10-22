export type Campus = 'YOUSSOUFIA' | 'SAFI' | 'NADOR';
export type UserRole = 'STUDENT' | 'LANDLORD' | 'AGENT' | 'ADMIN';
export type PropertyType = 'ROOM' | 'STUDIO' | 'APARTMENT' | 'HOUSE';
export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'RENTED' | 'ARCHIVED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
export type RoommateGenderPreference = 'ANY' | 'MALE' | 'FEMALE';
export type RoommatePostStatus = 'OPEN' | 'CLOSED';
export type ReportTargetType = 'LISTING' | 'USER' | 'ROOMMATE_POST';
export type ReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  campus: Campus;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  isEmailVerified: boolean;
  isVerified: boolean;
  agencyName?: string;
  agencyFeeDetails?: string;
  createdAt: string;
}

export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface Listing {
  id: string;
  owner: User;
  title: string;
  description: string;
  campus: Campus;
  neighborhood: string;
  location: Coordinates;
  exactAddress?: string | null;
  pricePerMonth: number;
  propertyType: PropertyType;
  roomCount: number;
  bathroomCount: number;
  maxCapacity: number;
  availablePlaces: number;
  furnished: boolean;
  amenities: string[];
  images: string[];
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  availableFrom: string;
  createdAt: string;
}

export interface RoommatePost {
  id: string;
  author: User;
  title: string;
  description: string;
  campus: Campus;
  budgetMax: number;
  targetMoveInDate: string;
  preferredRoommateGender: RoommateGenderPreference;
  status: RoommatePostStatus;
  lifestyleHabits: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  listingId?: string;
  roommatePostId?: string;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  listing: Listing;
  createdAt: string;
}

export interface Report {
  id: string;
  reporter: User;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  actionTaken?: string;
  createdAt: string;
}
