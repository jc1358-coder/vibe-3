export const scheduleTypes = ["휴가", "근무", "출장", "교육", "기타"] as const;

export type ScheduleType = (typeof scheduleTypes)[number];

export type TeamMember = {
  id: number;
  name: string;
  department: string;
  position: string;
  created_at: string;
  updated_at: string;
};

export type TeamMemberPayload = {
  name: string;
  department: string;
  position: string;
};

export type TeamSchedule = {
  id: number;
  member_id: number;
  member_name: string;
  department: string;
  position: string;
  schedule_type: ScheduleType;
  title: string;
  start_at: string;
  end_at: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamSchedulePayload = {
  member_id: number;
  schedule_type: ScheduleType;
  title: string;
  start_at: string;
  end_at: string;
  memo: string | null;
};

export type ListResponse<T> = {
  items: T[];
};