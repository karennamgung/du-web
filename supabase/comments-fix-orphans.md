# 예전에 적은 리뷰이 안 보일 때

## 원인

- **학원 ID가 바뀐 경우**  
  `academies` 테이블을 다시 만들거나 시드를 다시 돌리면 학원마다 **새 UUID**가 부여됩니다.  
  예전 리뷰은 **옛날 academy_id**를 가지고 있어서, 지금 화면에 보이는 학원(새 id)으로 조회하면 나오지 않습니다.

## 확인 방법

1. Supabase 대시보드 → **SQL Editor**에서 `supabase/comments-diagnose.sql` 내용을 실행합니다.
2. **3번 쿼리** 결과에 행이 있으면 → “고아 리뷰”(현재 학원 목록에 없는 academy_id를 가진 리뷰)이 있는 것입니다. 이 리뷰들이 “예전에 적은 리뷰”입니다.

## 해결 방법

### A. 고아 리뷰을 현재 학원에 다시 붙이기 (수동 매핑)

예전 academy_id → 지금 학원 id 매핑을 알고 있을 때만 가능합니다.

```sql
-- 예: 옛날 academy_id 'OLD-UUID'를 현재 '송도영어학원' id로 붙이기
UPDATE public.comments
SET academy_id = (SELECT id FROM public.academies WHERE name = '송도영어학원' LIMIT 1)
WHERE academy_id = 'OLD-UUID-HERE';
```

- 3번 쿼리 결과에서 `academy_id`(옛 id)를 확인한 뒤, 위에서 `OLD-UUID-HERE`를 그 값으로 바꿉니다.
- `name = '송도영어학원'` 부분을 해당 학원명으로 맞춥니다.
- 학원이 여러 개면 필요한 만큼 `UPDATE`를 반복합니다.

### B. 앞으로 학원 ID가 바뀌지 않게 하기

- `academies` 시드/마이그레이션에서 학원 ID를 **고정 UUID**로 넣습니다.  
  예: `id uuid PRIMARY KEY DEFAULT 'a1b2c3d4-...'::uuid` 처럼 학원마다 고정 id를 두면, 시드를 다시 돌려도 같은 id가 유지되어 리뷰이 계속 해당 학원에 붙어 있습니다.

## RLS/권한

- 리뷰은 `is_hidden = false`인 행만 조회되므로, “예전 리뷰”이 숨김 처리돼 있으면 안 보일 수 있습니다.
- `anon` / `authenticated` 모두 `is_hidden = false`인 리뷰만 읽을 수 있도록 정책이 있어야 합니다.  
  진단 SQL은 RLS와 관계없이 실행되므로, 3번 쿼리로 “DB에 있는데 앱에서는 안 보이는 리뷰”이 있는지 먼저 확인하는 것이 좋습니다.
