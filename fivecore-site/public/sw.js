// 5차원 자기주도학습 Service Worker — 오프라인 캐시
const CACHE = 'fivecore-v1'
const SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg']

// 설치 시 앱 셸 캐시
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  )
  self.skipWaiting()
})

// 활성화 시 이전 버전 캐시 삭제
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 네비게이션(HTML): 네트워크 우선 → 실패 시 캐시된 index.html 반환
// 정적 자산(JS/CSS/이미지): 캐시 우선 → 없으면 네트워크 후 캐시 저장
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, clone))
        return res
      })
    })
  )
})
