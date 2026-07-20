// Tipos que espelham as tabelas do banco. Mantê-los aqui evita repetição e dá
// autocomplete em todo o servidor.

export type MatchType = "contains" | "exact" | "any";

export type Automation = {
  id: string;
  name: string;
  active: boolean;
  trigger_comment: boolean;
  trigger_story: boolean;
  trigger_dm: boolean;
  keywords: string[];
  match_type: MatchType;
  media_id: string | null;
  public_replies: string[];
  welcome_message: string | null;
  quick_reply_label: string | null;
  link_message: string | null;
  link_button_label: string | null;
  link_url: string | null;
  reminder_message: string | null;
  reminder_delay_seconds: number;
  created_at: string;
  updated_at: string;
};

export type AppConfig = {
  id: number;
  ig_user_id: string | null;
  username: string | null;
  name: string | null;
  profile_picture_url: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  updated_at: string;
};

/** config já conectada (token e id garantidos). */
export type ConnectedConfig = AppConfig & {
  ig_user_id: string;
  access_token: string;
};

export type Contact = {
  ig_user_id: string;
  username: string | null;
  first_contact_at: string;
  last_inbound_at: string | null;
  last_automation_id: string | null;
  updated_at: string;
};

export type QueueKind =
  | "private_reply"
  | "public_reply"
  | "welcome_dm"
  | "followup";

export type Followup = {
  id: string;
  automation_id: string;
  position: number;
  delay_seconds: number;
  label: string | null;
  message: unknown;
  created_at: string;
};
