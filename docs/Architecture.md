# 공공직군 행정업무 슈퍼앱 Architecture

## 1. 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | TypeScript, Vite, React |
| Backend | Python, FastAPI, uv |
| Database | SQLite |
| Package Manager | npm, uv |
| Runtime | Node.js, uv-managed Python |

## 2. 시스템 개요

본 시스템은 React 기반 SPA와 FastAPI 기반 REST API 서버로 구성한다. 초기 데이터 저장소는 SQLite를 사용하며, 파일 업로드 결과와 업무 이력은 백엔드에서 관리한다.

```text
Browser
  |
  | HTTP/JSON, file upload/download
  v
React + Vite Frontend
  |
  | REST API
  v
FastAPI Backend
  |
  | SQL / file IO
  v
SQLite + Local Storage
```

## 3. 프로젝트 구조

```text
Day3/
  frontend/
    package.json
    package-lock.json
    node_modules/
    src/
      app/
      pages/
      features/
      shared/
    public/
  backend/
    pyproject.toml
    uv.lock
    .venv/
    app/
      main.py
      api/
      core/
      db/
      models/
      schemas/
      services/
      repositories/
      workers/
      files/
    data/
      app.db
      uploads/
      exports/
  docs/
    PRD.md
    Architecture.md
    Operation.md
    index.html
```

현재는 FE/BE 필수 의존성 설치 단계이므로 일부 디렉터리는 향후 구현 시 생성한다.

## 4. Frontend 구조

| 경로 | 역할 |
| --- | --- |
| `src/app` | 앱 라우터, 전역 레이아웃, 전역 상태 초기화 |
| `src/pages` | 페이지 단위 컴포넌트 |
| `src/features/schedules` | 팀 일정 관리 기능 |
| `src/features/excel` | 엑셀 분리/병합 UI |
| `src/features/complaints` | 민원 챗봇 UI |
| `src/features/news` | 뉴스 수집/조회 UI |
| `src/shared/api` | API 클라이언트 |
| `src/shared/ui` | 공통 UI 컴포넌트 |
| `src/shared/types` | 공통 TypeScript 타입 |

## 5. Backend 구조

| 경로 | 역할 |
| --- | --- |
| `app/main.py` | FastAPI 앱 진입점 |
| `app/api` | REST API 라우터 |
| `app/core` | 설정, 보안, 로깅, 공통 예외 처리 |
| `app/db` | SQLite 연결, 마이그레이션, 세션 관리 |
| `app/models` | DB 모델 |
| `app/schemas` | 요청/응답 스키마 |
| `app/services` | 비즈니스 로직 |
| `app/repositories` | DB 접근 로직 |
| `app/workers` | 예약 수집, 장시간 처리 작업 |
| `app/files` | 업로드/다운로드 파일 처리 |

## 6. 모듈별 역할

### 6.1 Schedule Module

#### 책임
- 팀원 일정 CRUD
- 캘린더 조회 데이터 제공
- 일정 유형별 필터링
- 일정 변경 감사 로그 기록

#### 주요 API
| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/schedules` | 일정 목록 조회 |
| `POST` | `/api/schedules` | 일정 등록 |
| `GET` | `/api/schedules/{id}` | 일정 상세 조회 |
| `PUT` | `/api/schedules/{id}` | 일정 수정 |
| `DELETE` | `/api/schedules/{id}` | 일정 삭제 |

### 6.2 Excel Automation Module

#### 책임
- 엑셀 파일 업로드
- 컬럼 기준 파일 분리
- 다중 파일 병합
- 결과 파일 생성 및 다운로드
- 처리 이력 관리

#### 주요 API
| Method | Endpoint | 설명 |
| --- | --- | --- |
| `POST` | `/api/excel/split` | 엑셀 파일 분리 |
| `POST` | `/api/excel/merge` | 엑셀 파일 병합 |
| `GET` | `/api/excel/jobs` | 처리 이력 조회 |
| `GET` | `/api/excel/jobs/{id}/download` | 결과 다운로드 |

### 6.3 Complaint Chatbot Module

#### 책임
- 민원 매뉴얼 업로드 및 관리
- 매뉴얼 기반 검색
- 민원 대응 답변 초안 생성
- 근거 문서 표시
- 답변 생성 이력 관리

#### 주요 API
| Method | Endpoint | 설명 |
| --- | --- | --- |
| `POST` | `/api/complaints/manuals` | 매뉴얼 업로드 |
| `GET` | `/api/complaints/manuals` | 매뉴얼 목록 |
| `POST` | `/api/complaints/chat` | 민원 응답 초안 생성 |
| `GET` | `/api/complaints/sessions` | 챗봇 사용 이력 |

### 6.4 News Collection Module

#### 책임
- 공공 행정 관련 뉴스 수집
- 중복 제거
- 기사 메타데이터 저장
- 날짜/키워드별 조회
- 수집 실패 로그 관리

#### 주요 API
| Method | Endpoint | 설명 |
| --- | --- | --- |
| `POST` | `/api/news/collect` | 뉴스 수동 수집 |
| `GET` | `/api/news/articles` | 기사 목록 조회 |
| `GET` | `/api/news/collect-runs` | 수집 실행 이력 |

## 7. 데이터베이스 초안

```text
users
  id, name, department, role, created_at

team_schedules
  id, user_id, type, title, start_at, end_at, memo, created_at, updated_at

excel_jobs
  id, job_type, status, input_file_path, output_file_path, error_message, created_by, created_at

manual_documents
  id, title, file_path, indexed_at, created_at

chat_sessions
  id, user_id, complaint_text, answer_draft, evidence_json, created_at

news_articles
  id, title, source, url, published_at, keyword, summary, collected_at

news_collect_runs
  id, status, started_at, ended_at, error_message

audit_logs
  id, actor_id, action, target_type, target_id, detail_json, created_at
```

## 8. 기술적 요구사항

### 8.1 API
- 모든 API는 `/api` prefix를 사용한다.
- 요청/응답은 기본적으로 JSON을 사용한다.
- 파일 업로드는 `multipart/form-data`를 사용한다.
- 오류 응답은 공통 포맷을 사용한다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 값이 올바르지 않습니다.",
    "details": {}
  }
}
```

### 8.2 파일 처리
- 업로드 파일은 백엔드의 `data/uploads` 하위에 저장한다.
- 결과 파일은 `data/exports` 하위에 저장한다.
- 파일명은 충돌과 경로 조작을 방지하기 위해 서버에서 생성한다.
- 파일 보관 기간 정책을 별도로 둔다.

### 8.3 보안
- 초기 개발에서는 로컬 실행을 기준으로 한다.
- 운영 전 사용자 인증/권한 모델을 반드시 추가한다.
- 민원 매뉴얼과 엑셀 업로드 파일은 외부 정적 경로로 직접 노출하지 않는다.
- 모든 파일 다운로드는 권한 확인 후 API를 통해 제공한다.

### 8.4 스케줄링
- MVP에서는 뉴스 수집을 수동 실행 API로 제공한다.
- 후속 단계에서 백엔드 worker 또는 OS scheduler를 통해 매일 아침 자동 수집을 구성한다.

### 8.5 SQLite 사용 기준
- 초기 개발과 단일 서버 운영을 전제로 SQLite를 사용한다.
- 동시 쓰기 부하가 커지는 경우 PostgreSQL 전환을 고려한다.
- 저장소 계층을 분리하여 DB 교체 비용을 낮춘다.

## 9. 개발 원칙

- 기능별 모듈 경계를 명확히 분리한다.
- API 스키마와 DB 모델을 분리한다.
- 파일 처리, 챗봇 응답 생성, 뉴스 수집은 서비스 레이어에서 처리한다.
- 개인정보와 민원 원문은 불필요하게 로그에 남기지 않는다.
- 챗봇 답변은 최종 판단이 아닌 담당자 검토용 초안으로 표시한다.

