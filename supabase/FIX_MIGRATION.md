# children 데이터 마이그레이션 문제 해결

데이터가 옮겨지지 않는 경우 다음을 확인하세요.

## 1단계: 현재 상태 확인

`check-migration.sql` 파일을 실행하여 현재 상태를 확인하세요.

또는 아래 쿼리를 실행:

```sql
-- children 테이블의 parent_id가 무엇을 참조하는지 확인
SELECT 
  c.parent_id,
  p.user_id,
  p.id,
  CASE 
    WHEN c.parent_id = p.user_id THEN '✅ user_id와 일치'
    WHEN c.parent_id = p.id THEN '✅ id와 일치'
    ELSE '❌ 매칭 안됨'
  END AS "매칭 상태"
FROM public.children c
LEFT JOIN public.profiles p ON c.parent_id = p.user_id OR c.parent_id = p.id
LIMIT 10;
```

## 2단계: 상황별 마이그레이션

### 상황 A: parent_id가 auth.users.id (profiles.user_id)를 참조하는 경우

`migrate-to-json-children.sql` 또는 `migrate-children-data.sql` 실행

이미 실행했다면 다시 실행해도 안전합니다 (덮어쓰기).

### 상황 B: parent_id가 profiles.id를 참조하는 경우

아래 SQL 실행:

```sql
-- profiles 테이블에 children 컬럼 추가
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- parent_id가 profiles.id를 참조하는 경우
UPDATE public.profiles p
SET children = COALESCE(
  (
    SELECT json_agg(
      json_build_object(
        'name', c.name,
        'birth_year', c.birth_year,
        'education_institution', c.education_institution,
        'gender', c.gender
      ) ORDER BY c."order" NULLS LAST
    )
    FROM public.children c
    WHERE c.parent_id = p.id  -- profiles.id와 매칭
  ),
  '[]'::jsonb
)
WHERE EXISTS (
  SELECT 1 FROM public.children c WHERE c.parent_id = p.id
);
```

### 상황 C: 어떤 경우에도 작동하는 범용 마이그레이션

아래 SQL은 두 경우 모두 처리합니다:

```sql
-- profiles 테이블에 children 컬럼 추가
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- 범용 마이그레이션 (user_id 또는 id로 매칭 시도)
UPDATE public.profiles p
SET children = COALESCE(
  (
    SELECT json_agg(
      json_build_object(
        'name', c.name,
        'birth_year', c.birth_year,
        'education_institution', c.education_institution,
        'gender', c.gender
      ) ORDER BY c."order" NULLS LAST
    )
    FROM public.children c
    WHERE c.parent_id = p.user_id OR c.parent_id = p.id
  ),
  '[]'::jsonb
)
WHERE EXISTS (
  SELECT 1 FROM public.children c 
  WHERE c.parent_id = p.user_id OR c.parent_id = p.id
);
```

## 3단계: 마이그레이션 결과 확인

```sql
-- 마이그레이션된 데이터 확인
SELECT 
  p.nickname,
  p.user_type,
  jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) AS "children_count",
  p.children
FROM public.profiles p
WHERE jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) > 0
ORDER BY p.created_at DESC;

-- children 테이블과 비교
SELECT 
  'children 테이블' AS "소스",
  COUNT(*) AS "레코드 수"
FROM public.children
UNION ALL
SELECT 
  'profiles.children' AS "소스",
  SUM(jsonb_array_length(COALESCE(children, '[]'::jsonb))) AS "레코드 수"
FROM public.profiles;
```

## 4단계: 문제 해결

### 데이터가 여전히 옮겨지지 않는 경우

1. **외래 키 제약조건 확인:**
```sql
SELECT 
  tc.constraint_name,
  ccu.table_name AS "참조 테이블"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'children' 
  AND tc.constraint_type = 'FOREIGN KEY';
```

2. **수동으로 데이터 확인:**
```sql
-- children 테이블의 parent_id 샘플
SELECT DISTINCT parent_id FROM public.children LIMIT 5;

-- profiles 테이블의 user_id와 id 샘플
SELECT user_id, id FROM public.profiles LIMIT 5;

-- 매칭되는지 확인
SELECT 
  c.parent_id AS "children.parent_id",
  p.user_id AS "profiles.user_id",
  p.id AS "profiles.id"
FROM public.children c
LEFT JOIN public.profiles p ON c.parent_id = p.user_id OR c.parent_id = p.id
LIMIT 10;
```

3. **수동 마이그레이션 (필요한 경우):**
특정 사용자의 데이터만 수동으로 마이그레이션:

```sql
-- 특정 사용자 ID로 마이그레이션
UPDATE public.profiles
SET children = '[
  {"name": "아이이름", "birth_year": 2015, "education_institution": "학교명", "gender": "male"}
]'::jsonb
WHERE user_id = '사용자UUID';
```
