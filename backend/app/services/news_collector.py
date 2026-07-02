from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta, timezone
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from app.repositories.news import NEWS_SOURCE

KST = timezone(timedelta(hours=9))
LIST_URL = "https://www.korea.kr/news/policyNewsList.do"


@dataclass(slots=True)
class ArticleCandidate:
    title: str
    url: str
    published_at: str
    summary: str | None = None


class KoreaPolicyNewsCollector:
    source = NEWS_SOURCE

    def collect(self, target_date: date) -> list[dict[str, object]]:
        candidates = self._fetch_list_page(target_date)
        articles: list[dict[str, object]] = []
        for candidate in candidates:
            article = self._fetch_detail(candidate, target_date)
            if article is not None:
                articles.append(article)
        return articles

    def _fetch_list_page(self, target_date: date) -> list[ArticleCandidate]:
        with httpx.Client(timeout=20.0, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
            response = client.get(LIST_URL)
            response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        candidates: list[ArticleCandidate] = []
        seen: set[str] = set()
        for anchor in soup.select("a"):
            href = anchor.get("href")
            text = anchor.get_text(" ", strip=True)
            if not href or not text:
                continue
            if "policyNews" not in href and "news" not in href:
                continue
            absolute_url = urljoin(LIST_URL, href)
            if absolute_url in seen:
                continue
            published_at = self._extract_date_text(anchor)
            if published_at is None or published_at != target_date.isoformat():
                continue
            summary = self._extract_summary(anchor)
            candidates.append(ArticleCandidate(title=text, url=absolute_url, published_at=published_at, summary=summary))
            seen.add(absolute_url)
        return candidates

    def _fetch_detail(self, candidate: ArticleCandidate, target_date: date) -> dict[str, object] | None:
        with httpx.Client(timeout=20.0, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
            response = client.get(candidate.url)
            response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        published_at = self._extract_detail_date(soup) or candidate.published_at
        if published_at != target_date.isoformat():
            return None
        summary = candidate.summary or self._extract_detail_summary(soup)
        title = self._extract_detail_title(soup) or candidate.title
        return {
            "source": self.source,
            "title": title,
            "url": candidate.url,
            "summary": summary,
            "published_at": published_at,
            "collected_date": target_date.isoformat(),
        }

    def _extract_date_text(self, node) -> str | None:
        text = node.parent.get_text(" ", strip=True) if node.parent else node.get_text(" ", strip=True)
        for token in text.replace(".", "-").replace("/", "-").split():
            if len(token) == 10 and token[4] == "-" and token[7] == "-":
                try:
                    return date.fromisoformat(token).isoformat()
                except ValueError:
                    continue
        return None

    def _extract_summary(self, node) -> str | None:
        parent = node.parent
        if parent is None:
            return None
        text = parent.get_text(" ", strip=True)
        if len(text) <= len(node.get_text(strip=True)):
            return None
        remainder = text.replace(node.get_text(" ", strip=True), "", 1).strip()
        return remainder[:300] or None

    def _extract_detail_title(self, soup: BeautifulSoup) -> str | None:
        for selector in ["h1", ".title", ".tit", ".article-title"]:
            node = soup.select_one(selector)
            if node:
                text = node.get_text(" ", strip=True)
                if text:
                    return text
        return None

    def _extract_detail_summary(self, soup: BeautifulSoup) -> str | None:
        for selector in [".summary", ".article-summary", ".desc", ".txt"]:
            node = soup.select_one(selector)
            if node:
                text = node.get_text(" ", strip=True)
                if text:
                    return text[:300]
        return None

    def _extract_detail_date(self, soup: BeautifulSoup) -> str | None:
        text_nodes = soup.get_text(" ", strip=True).replace(".", "-").replace("/", "-").split()
        for token in text_nodes:
            if len(token) == 10 and token[4] == "-" and token[7] == "-":
                try:
                    return date.fromisoformat(token).isoformat()
                except ValueError:
                    continue
        return None


def normalize_collect_error(exc: Exception) -> str:
    if isinstance(exc, httpx.ConnectError):
        return "정책브리핑 사이트에 연결할 수 없습니다. 네트워크 상태나 대상 사이트 접근 가능 여부를 확인해 주세요."
    if isinstance(exc, httpx.TimeoutException):
        return "정책브리핑 기사 수집이 시간 초과되었습니다. 잠시 후 다시 시도해 주세요."
    if isinstance(exc, httpx.HTTPStatusError):
        status_code = exc.response.status_code if exc.response is not None else "unknown"
        return f"정책브리핑 응답이 정상적이지 않습니다. HTTP {status_code} 상태를 확인해 주세요."
    message = str(exc).strip()
    if "WinError 10061" in message:
        return "정책브리핑 사이트에 연결할 수 없습니다. 네트워크 상태나 대상 사이트 접근 가능 여부를 확인해 주세요."
    if not message:
        return "정책브리핑 기사 수집 중 알 수 없는 오류가 발생했습니다."
    return message


def collect_news_for_date(target_date: date, mode: str) -> dict[str, object]:
    from app.repositories.news import create_collect_run, run_exists, update_collect_run, upsert_article

    if run_exists(target_date.isoformat(), mode):
        return {
            "target_date": target_date.isoformat(),
            "mode": mode,
            "status": "skipped",
            "count": 0,
            "items": [],
        }

    run_id = create_collect_run(target_date.isoformat(), mode)
    collector = KoreaPolicyNewsCollector()
    try:
        articles = collector.collect(target_date)
        for article in articles:
            upsert_article(article)
        update_collect_run(run_id, "completed")
        return {
            "target_date": target_date.isoformat(),
            "mode": mode,
            "status": "completed",
            "count": len(articles),
            "items": articles,
        }
    except Exception as exc:
        error_message = normalize_collect_error(exc)
        update_collect_run(run_id, "failed", error_message)
        return {
            "target_date": target_date.isoformat(),
            "mode": mode,
            "status": "failed",
            "count": 0,
            "items": [],
            "error_message": error_message,
        }
