# 공공직군 행정업무 슈퍼앱 Operation

## 1. 문서 목적

본 문서는 개발 및 운영자가 프로젝트를 실행하고 관리하는 데 필요한 절차를 정리한다. 현재 프로젝트는 초기 환경 구성 단계이며, 실제 애플리케이션 코드는 후속 단계에서 작성한다.

## 2. 사전 요구사항

| 항목 | 필요 상태 |
| --- | --- |
| Node.js | 설치 필요 |
| npm | 설치 필요 |
| uv | 설치 필요 |
| Python | 시스템 Python이 없어도 `uv` 관리 Python 사용 가능 |
| SQLite | Python 내장 `sqlite3` 사용 가능, CLI는 선택 사항 |

현재 확인된 환경:

| 항목 | 버전 |
| --- | --- |
| Node.js | `v24.18.0` |
| npm | `11.16.0` |
| uv | `0.11.25` |
| uv-managed Python | `3.14.6` |
| Python SQLite | `3.53.1` |

## 3. 환경 변수

현재 환경에서는 기본 uv 캐시 경로 접근 권한 문제가 확인되었다. 백엔드 명령 실행 전 아래 환경 변수를 지정한다.

```powershell
$env:UV_CACHE_DIR='C:\Users\admin\Desktop\Day3\.uv-cache'
```

장기적으로는 PowerShell profile 또는 프로젝트 실행 스크립트에서 자동 설정하는 방식을 권장한다.

## 4. Frontend 실행 준비

### 4.1 설치된 모듈

위치: `frontend`

```text
react
react-dom
vite
typescript
@vitejs/plugin-react
@types/react
@types/react-dom
```

### 4.2 의존성 재설치

```powershell
cd C:\Users\admin\Desktop\Day3\frontend
npm install
```

### 4.3 개발 서버 실행

현재는 소스 코드와 Vite 설정 파일을 아직 작성하지 않았으므로 개발 서버 실행은 후속 구현 이후 가능하다.

예상 실행 명령:

```powershell
cd C:\Users\admin\Desktop\Day3\frontend
npm run dev
```

필요한 후속 구성:

```text
index.html
src/main.tsx
src/App.tsx
vite.config.ts
tsconfig.json
```

## 5. Backend 실행 준비

### 5.1 설치된 모듈

위치: `backend`

```text
fastapi
uvicorn
```

### 5.2 가상환경

가상환경 위치:

```text
backend/.venv
```

활성화:

```powershell
cd C:\Users\admin\Desktop\Day3\backend
.\.venv\Scripts\activate
```

단, `uv` 사용을 표준으로 하므로 직접 활성화보다 `uv run` 사용을 권장한다.

### 5.3 의존성 동기화

```powershell
cd C:\Users\admin\Desktop\Day3\backend
$env:UV_CACHE_DIR='C:\Users\admin\Desktop\Day3\.uv-cache'
uv sync
```

### 5.4 개발 서버 실행

현재는 FastAPI 앱 코드가 아직 작성되지 않았으므로 서버 실행은 후속 구현 이후 가능하다.

예상 실행 명령:

```powershell
cd C:\Users\admin\Desktop\Day3\backend
$env:UV_CACHE_DIR='C:\Users\admin\Desktop\Day3\.uv-cache'
uv run uvicorn app.main:app --reload
```

필요한 후속 구성:

```text
app/main.py
app/api/
app/core/
app/db/
```

## 6. SQLite 운영

### 6.1 개발 DB 위치

권장 위치:

```text
backend/data/app.db
```

### 6.2 SQLite CLI

현재 `sqlite3` CLI는 설치되어 있지 않다. CLI가 없어도 Python 내장 `sqlite3` 모듈로 애플리케이션 개발은 가능하다.

CLI 설치가 필요한 경우:

```text
Windows용 SQLite Tools 설치 후 PATH 등록
```

### 6.3 백업

운영 전에는 정기 백업 정책이 필요하다.

권장 방식:

```text
매일 app.db 복사본 생성
파일명 예: app-YYYYMMDD.db
보관 기간: 내부 정책에 따름
```

## 7. 기능별 사용 흐름

### 7.1 팀원 스케쥴 관리

1. 사용자가 캘린더 화면에 접근한다.
2. 월/주/일 단위로 팀 일정을 조회한다.
3. 일정 유형, 팀원, 기간을 입력해 일정을 등록한다.
4. 변경 사항은 감사 로그에 기록한다.

### 7.2 엑셀 업무 자동화

1. 사용자가 엑셀 파일을 업로드한다.
2. 분리 또는 병합 작업을 선택한다.
3. 분리 작업인 경우 기준 컬럼을 선택한다.
4. 백엔드가 파일을 처리하고 결과 파일을 생성한다.
5. 사용자가 결과 파일을 다운로드한다.

### 7.3 민원 대응 챗봇

1. 관리자가 민원 매뉴얼을 업로드한다.
2. 담당자가 민원 내용을 입력한다.
3. 시스템이 매뉴얼 근거를 검색한다.
4. 챗봇이 응답 초안과 근거를 함께 제공한다.
5. 담당자가 검토 후 실제 답변에 사용한다.

### 7.4 뉴스 기사 수집

1. 사용자가 뉴스 수집을 수동 실행한다.
2. 시스템이 등록된 키워드로 뉴스를 수집한다.
3. 중복 기사를 제거한다.
4. 기사 목록과 수집 이력을 저장한다.
5. 사용자가 날짜와 키워드로 기사를 조회한다.

## 8. 자주 발생하는 에러

### 8.1 `python` 명령을 찾을 수 없음

증상:

```text
Python was not found
```

원인:

```text
시스템 PATH에 Python이 등록되어 있지 않음
```

해결:

```powershell
uv run python --version
```

본 프로젝트는 `uv` 관리 Python 사용을 기준으로 한다.

### 8.2 uv 캐시 접근 권한 오류

증상:

```text
Failed to initialize cache
액세스가 거부되었습니다.
```

해결:

```powershell
$env:UV_CACHE_DIR='C:\Users\admin\Desktop\Day3\.uv-cache'
```

### 8.3 `sqlite3` CLI를 찾을 수 없음

증상:

```text
sqlite3 용어가 cmdlet로 인식되지 않습니다.
```

해결:

```text
Python 내장 sqlite3를 사용하거나 SQLite CLI를 별도 설치한다.
```

### 8.4 npm 레지스트리 접근 실패

증상:

```text
cache mode is 'only-if-cached' but no cached response is available
```

원인:

```text
네트워크 제한 또는 npm 캐시 정책 문제
```

해결:

```text
네트워크 접근 권한을 허용한 뒤 npm install 또는 npm create vite 실행
```

## 9. 운영 주의사항

- 민원 내용과 첨부 문서에는 개인정보가 포함될 수 있으므로 로그에 원문을 남기지 않는다.
- 챗봇 답변은 최종 답변이 아니라 담당자 검토용 초안으로 안내한다.
- 엑셀 업로드 파일과 결과 파일의 보관 기간을 정해야 한다.
- 뉴스 기사 원문을 저장하지 않고 제목, 링크, 출처, 요약 등 필요한 메타데이터 중심으로 저장한다.
- 운영 전 인증, 권한, 감사 로그, 백업 정책을 반드시 확정한다.

