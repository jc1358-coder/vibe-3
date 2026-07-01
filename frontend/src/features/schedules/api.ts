import { apiDelete, apiGet, apiPost, apiPut } from "../../shared/api/client";
import type {
  ListResponse,
  ScheduleType,
  TeamMember,
  TeamMemberPayload,
  TeamSchedule,
  TeamSchedulePayload
} from "../../shared/types/schedule";

export async function fetchMembers(): Promise<TeamMember[]> {
  const response = await apiGet<ListResponse<TeamMember>>("/api/members");
  return response.items;
}

export function createMember(payload: TeamMemberPayload): Promise<TeamMember> {
  return apiPost<TeamMember>("/api/members", payload);
}

export function updateMember(id: number, payload: TeamMemberPayload): Promise<TeamMember> {
  return apiPut<TeamMember>(`/api/members/${id}`, payload);
}

export function removeMember(id: number): Promise<void> {
  return apiDelete(`/api/members/${id}`);
}

export type ScheduleQuery = {
  from: string;
  to: string;
  memberId?: number;
  scheduleType?: ScheduleType;
};

export async function fetchSchedules(query: ScheduleQuery): Promise<TeamSchedule[]> {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.memberId) {
    params.set("member_id", String(query.memberId));
  }
  if (query.scheduleType) {
    params.set("type", query.scheduleType);
  }

  const response = await apiGet<ListResponse<TeamSchedule>>(`/api/schedules?${params.toString()}`);
  return response.items;
}

export function createSchedule(payload: TeamSchedulePayload): Promise<TeamSchedule> {
  return apiPost<TeamSchedule>("/api/schedules", payload);
}

export function updateSchedule(id: number, payload: TeamSchedulePayload): Promise<TeamSchedule> {
  return apiPut<TeamSchedule>(`/api/schedules/${id}`, payload);
}

export function removeSchedule(id: number): Promise<void> {
  return apiDelete(`/api/schedules/${id}`);
}