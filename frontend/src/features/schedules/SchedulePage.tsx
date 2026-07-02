import { useEffect, useMemo, useState } from 'react';
import type {
  ScheduleType,
  TeamMember,
  TeamMemberPayload,
  TeamSchedule,
  TeamSchedulePayload
} from '../../shared/types/schedule';
import { scheduleTypes } from '../../shared/types/schedule';
import {
  createMember,
  createSchedule,
  fetchMembers,
  fetchSchedules,
  removeMember,
  removeSchedule,
  updateMember,
  updateSchedule
} from './api';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  formatKoreanDate,
  formatMonthTitle,
  formatTimeRange,
  getCalendarCells,
  isDateWithinSchedule,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
  toDateTimeInputValue
} from './date';

const emptyMember: TeamMemberPayload = { name: '', department: '', position: '' };
const today = new Date();

type ViewMode = 'week' | 'month';
type MemberModalState = { mode: 'create'; member?: undefined } | { mode: 'edit'; member: TeamMember };
type ScheduleModalState =
  | { mode: 'create'; schedule?: undefined; date?: Date }
  | { mode: 'edit'; schedule: TeamSchedule; date?: undefined };

export function SchedulePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [schedules, setSchedules] = useState<TeamSchedule[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(today);
  const [memberFilter, setMemberFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ScheduleType>('all');
  const [memberModal, setMemberModal] = useState<MemberModalState | null>(null);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (viewMode === 'week') {
      return { from: toDateInputValue(startOfWeek(anchorDate)), to: toDateInputValue(endOfWeek(anchorDate)) };
    }
    return { from: toDateInputValue(startOfMonth(anchorDate)), to: toDateInputValue(endOfMonth(anchorDate)) };
  }, [anchorDate, viewMode]);

  async function loadMembers() {
    setMembers(await fetchMembers());
  }

  async function loadSchedules() {
    const result = await fetchSchedules({
      from: range.from,
      to: range.to,
      memberId: memberFilter === 'all' ? undefined : Number(memberFilter),
      scheduleType: typeFilter === 'all' ? undefined : typeFilter
    });
    setSchedules(result);
  }

  async function refreshAll() {
    setError(null);
    setIsLoading(true);
    try {
      const [memberResult, scheduleResult] = await Promise.all([
        fetchMembers(),
        fetchSchedules({
          from: range.from,
          to: range.to,
          memberId: memberFilter === 'all' ? undefined : Number(memberFilter),
          scheduleType: typeFilter === 'all' ? undefined : typeFilter
        })
      ]);
      setMembers(memberResult);
      setSchedules(scheduleResult);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, [range.from, range.to, memberFilter, typeFilter]);

  async function handleSaveMember(payload: TeamMemberPayload, member?: TeamMember) {
    if (member) {
      await updateMember(member.id, payload);
    } else {
      await createMember(payload);
    }
    setMemberModal(null);
    await loadMembers();
  }

  async function handleDeleteMember(member: TeamMember) {
    if (!window.confirm(`${member.name} 직원을 삭제할까요?`)) {
      return;
    }
    try {
      await removeMember(member.id);
      if (memberFilter === String(member.id)) {
        setMemberFilter('all');
      }
      await Promise.all([loadMembers(), loadSchedules()]);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '직원을 삭제하지 못했습니다.');
    }
  }

  async function handleSaveSchedule(payload: TeamSchedulePayload, schedule?: TeamSchedule) {
    if (schedule) {
      await updateSchedule(schedule.id, payload);
    } else {
      await createSchedule(payload);
    }
    setScheduleModal(null);
    await loadSchedules();
  }

  async function handleDeleteSchedule(schedule: TeamSchedule) {
    if (!window.confirm(`${schedule.title} 일정을 삭제할까요?`)) {
      return;
    }
    await removeSchedule(schedule.id);
    setScheduleModal(null);
    await loadSchedules();
  }

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchorDate), index));

  return (
    <main className="schedule-shell">
      <header className="schedule-hero">
        <div>
          <p className="eyebrow">일정 관리</p>
          <h1>팀 일정 관리</h1>
          <p className="lead">직원을 등록하고 휴가, 근무, 출장, 교육 일정을 주간 또는 월간 보기로 관리합니다.</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="secondary-button" onClick={() => setMemberModal({ mode: 'create' })}>
            직원 등록
          </button>
          <button type="button" className="primary-button" onClick={() => setScheduleModal({ mode: 'create' })} disabled={members.length === 0}>
            일정 등록
          </button>
        </div>
      </header>

      <section className="toolbar-card">
        <div className="segmented-control" aria-label="보기 방식">
          <button type="button" className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>
            주간 보기
          </button>
          <button type="button" className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>
            월간 보기
          </button>
        </div>

        <div className="date-controls">
          <button type="button" onClick={() => setAnchorDate(viewMode === 'week' ? addDays(anchorDate, -7) : addMonths(anchorDate, -1))}>
            이전
          </button>
          <strong>{viewMode === 'week' ? `${formatKoreanDate(weekDays[0])} - ${formatKoreanDate(weekDays[6])}` : formatMonthTitle(anchorDate)}</strong>
          <button type="button" onClick={() => setAnchorDate(viewMode === 'week' ? addDays(anchorDate, 7) : addMonths(anchorDate, 1))}>
            다음
          </button>
          <button type="button" onClick={() => setAnchorDate(new Date())}>오늘</button>
        </div>

        <div className="filters">
          <label>
            직원
            <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
              <option value="all">전체</option>
              {members.map((member) => (
                <option value={member.id} key={member.id}>{member.name}</option>
              ))}
            </select>
          </label>
          <label>
            유형
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | ScheduleType)}>
              <option value="all">전체</option>
              {scheduleTypes.map((type) => (
                <option value={type} key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="schedule-layout">
        <TeamMemberPanel members={members} onEdit={(member) => setMemberModal({ mode: 'edit', member })} onDelete={handleDeleteMember} />
        <section className="calendar-card">
          {isLoading ? (
            <p className="empty-state">일정 데이터를 불러오는 중입니다.</p>
          ) : viewMode === 'week' ? (
            <WeekScheduleTable schedules={schedules} weekDays={weekDays} onEdit={(schedule) => setScheduleModal({ mode: 'edit', schedule })} />
          ) : (
            <MonthCalendar schedules={schedules} anchorDate={anchorDate} onCreate={(date) => setScheduleModal({ mode: 'create', date })} onEdit={(schedule) => setScheduleModal({ mode: 'edit', schedule })} />
          )}
        </section>
      </section>

      {memberModal && (
        <MemberModal
          state={memberModal}
          onClose={() => setMemberModal(null)}
          onSubmit={handleSaveMember}
        />
      )}
      {scheduleModal && (
        <ScheduleModal
          state={scheduleModal}
          members={members}
          onClose={() => setScheduleModal(null)}
          onSubmit={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
        />
      )}
    </main>
  );
}

function TeamMemberPanel({ members, onEdit, onDelete }: { members: TeamMember[]; onEdit: (member: TeamMember) => void; onDelete: (member: TeamMember) => void }) {
  return (
    <aside className="member-card">
      <div className="section-heading">
        <p className="eyebrow">직원</p>
        <h2>직원 목록</h2>
      </div>
      {members.length === 0 ? (
        <p className="empty-state">등록된 직원이 없습니다.</p>
      ) : (
        <div className="member-list">
          {members.map((member) => (
            <article className="member-item" key={member.id}>
              <div>
                <strong>{member.name}</strong>
                <span>{member.department} · {member.position}</span>
              </div>
              <div className="item-actions">
                <button type="button" onClick={() => onEdit(member)}>수정</button>
                <button type="button" onClick={() => onDelete(member)}>삭제</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function WeekScheduleTable({ schedules, weekDays, onEdit }: { schedules: TeamSchedule[]; weekDays: Date[]; onEdit: (schedule: TeamSchedule) => void }) {
  return (
    <div className="table-wrap">
      <table className="schedule-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>직원</th>
            <th>유형</th>
            <th>일정</th>
            <th>시간</th>
            <th>메모</th>
          </tr>
        </thead>
        <tbody>
          {weekDays.map((day) => {
            const dateKey = toDateInputValue(day);
            const daySchedules = schedules.filter((schedule) => isDateWithinSchedule(day, schedule.start_at, schedule.end_at));
            if (daySchedules.length === 0) {
              return (
                <tr key={dateKey} className="muted-row">
                  <td>{formatKoreanDate(day)}</td>
                  <td colSpan={5}>등록된 일정이 없습니다.</td>
                </tr>
              );
            }
            return daySchedules.map((schedule, index) => (
              <tr key={schedule.id} onClick={() => onEdit(schedule)} className="clickable-row">
                {index === 0 && <td rowSpan={daySchedules.length}>{formatKoreanDate(day)}</td>}
                <td>{schedule.member_name}</td>
                <td><TypeBadge type={schedule.schedule_type} /></td>
                <td>{schedule.title}</td>
                <td>{formatTimeRange(schedule.start_at, schedule.end_at)}</td>
                <td>{schedule.memo ?? '-'}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

function MonthCalendar({ schedules, anchorDate, onCreate, onEdit }: { schedules: TeamSchedule[]; anchorDate: Date; onCreate: (date: Date) => void; onEdit: (schedule: TeamSchedule) => void }) {
  const cells = getCalendarCells(anchorDate);
  const currentMonth = anchorDate.getMonth();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="month-calendar">
      {weekdays.map((day) => <div className="weekday" key={day}>{day}</div>)}
      {cells.map((cell) => {
        const dateKey = toDateInputValue(cell);
        const daySchedules = schedules.filter((schedule) => isDateWithinSchedule(cell, schedule.start_at, schedule.end_at));
        return (
          <div className={`calendar-cell ${cell.getMonth() !== currentMonth ? 'outside' : ''}`} key={dateKey}>
            <button type="button" className="date-button" onClick={() => onCreate(cell)}>{cell.getDate()}</button>
            <div className="day-events">
              {daySchedules.map((schedule) => (
                <button type="button" className={`event-chip type-${schedule.schedule_type}`} key={schedule.id} onClick={() => onEdit(schedule)}>
                  <span>{schedule.member_name}</span>
                  {schedule.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MemberModal({ state, onClose, onSubmit }: { state: MemberModalState; onClose: () => void; onSubmit: (payload: TeamMemberPayload, member?: TeamMember) => Promise<void> }) {
  const [form, setForm] = useState<TeamMemberPayload>(state.member ?? emptyMember);
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await onSubmit(form, state.member);
    setIsSaving(false);
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <h2>{state.mode === 'edit' ? '직원 수정' : '직원 등록'}</h2>
        <TextField label="이름" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <TextField label="부서" value={form.department} onChange={(value) => setForm({ ...form, department: value })} />
        <TextField label="직급" value={form.position} onChange={(value) => setForm({ ...form, position: value })} />
        <ModalActions onClose={onClose} isSaving={isSaving} />
      </form>
    </div>
  );
}

function ScheduleModal({ state, members, onClose, onSubmit, onDelete }: { state: ScheduleModalState; members: TeamMember[]; onClose: () => void; onSubmit: (payload: TeamSchedulePayload, schedule?: TeamSchedule) => Promise<void>; onDelete: (schedule: TeamSchedule) => Promise<void> }) {
  const baseDate = state.date ?? new Date();
  const initial = state.schedule ?? {
    member_id: members[0]?.id ?? 0,
    schedule_type: '근무' as ScheduleType,
    title: '',
    start_at: toDateTimeInputValue(baseDate, 9),
    end_at: toDateTimeInputValue(baseDate, 18),
    memo: ''
  };
  const [form, setForm] = useState<TeamSchedulePayload>({
    member_id: initial.member_id,
    schedule_type: initial.schedule_type,
    title: initial.title,
    start_at: initial.start_at,
    end_at: initial.end_at,
    memo: initial.memo
  });
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await onSubmit(form, state.schedule);
    setIsSaving(false);
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <h2>{state.mode === 'edit' ? '일정 수정' : '일정 등록'}</h2>
        <label>
          직원
          <select value={form.member_id} onChange={(event) => setForm({ ...form, member_id: Number(event.target.value) })} required>
            {members.map((member) => (
              <option value={member.id} key={member.id}>{member.name} ({member.department})</option>
            ))}
          </select>
        </label>
        <label>
          유형
          <select value={form.schedule_type} onChange={(event) => setForm({ ...form, schedule_type: event.target.value as ScheduleType })} required>
            {scheduleTypes.map((type) => <option value={type} key={type}>{type}</option>)}
          </select>
        </label>
        <TextField label="일정" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <label>
          시작 시간
          <input type="datetime-local" value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} required />
        </label>
        <label>
          종료 시간
          <input type="datetime-local" value={form.end_at} onChange={(event) => setForm({ ...form, end_at: event.target.value })} required />
        </label>
        <label>
          메모
          <textarea value={form.memo ?? ''} onChange={(event) => setForm({ ...form, memo: event.target.value })} rows={4} />
        </label>
        <div className="modal-actions split-actions">
          {state.schedule && <button type="button" className="danger-button" onClick={() => onDelete(state.schedule)}>삭제</button>}
          <span />
          <button type="button" className="secondary-button" onClick={onClose}>취소</button>
          <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? '저장 중' : '저장'}</button>
        </div>
      </form>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}

function ModalActions({ onClose, isSaving }: { onClose: () => void; isSaving: boolean }) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary-button" onClick={onClose}>취소</button>
      <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? '저장 중' : '저장'}</button>
    </div>
  );
}

function TypeBadge({ type }: { type: ScheduleType }) {
  return <span className={`type-badge type-${type}`}>{type}</span>;
}
