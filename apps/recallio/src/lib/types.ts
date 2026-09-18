export type View = 'user' | 'admin';
export type Role = 'user' | 'admin' | 'superuser';

export type Session = {
  userId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: Role;
};

/** One account as the admin table shows it. */
export type ManagedUser = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  course_id: string | null;
  free_card_limit: number | null;
  free_tier_unlimited: boolean;
  cards_seen: number;
  has_paid_subscription: boolean;
};
