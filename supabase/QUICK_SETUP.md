# Supabase 빠른 설정 가이드

## 상황별 확인 및 실행 방법

### 상황 1: 테이블이 아직 생성되지 않음 (처음 시작)

**실행할 SQL:**
- `setup-onboarding.sql` 파일 전체 실행

**확인 방법:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'children');
```

결과가 없으면 → `setup-onboarding.sql` 실행

---

### 상황 2: 이미 테이블이 생성되어 있음

#### 2-1. profiles 테이블에 children 컬럼이 있는지 확인

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'children';
```

**결과가 없으면** → children 컬럼 추가 필요

#### 2-2. children 테이블이 있는지 확인

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'children';
```

**결과가 있으면** → 마이그레이션 필요

---

## 실행 순서

### 케이스 A: 새로 시작 (테이블 없음)

1. `setup-onboarding.sql` 실행
2. 완료!

### 케이스 B: profiles 테이블은 있지만 children 컬럼 없음

1. 아래 SQL 실행:

```sql
-- children 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- JSONB 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_children 
ON public.profiles USING GIN (children);
```

2. 완료!

### 케이스 C: children 테이블이 있고 데이터가 있음

1. `migrate-to-json-children.sql` 실행
2. 데이터 확인 후 children 테이블 삭제 (선택사항)

### 케이스 D: children 테이블이 있지만 데이터 없음

1. 아래 SQL 실행:

```sql
-- children 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- JSONB 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_children 
ON public.profiles USING GIN (children);

-- children 테이블 삭제
DROP TABLE IF EXISTS public.children CASCADE;
```

2. 완료!

---

## 빠른 확인 쿼리 (한 번에 실행)

아래 쿼리를 실행하여 현재 상태를 확인하세요:

```sql
-- 1. profiles 테이블 존재 확인
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    THEN '✅ profiles 테이블 존재'
    ELSE '❌ profiles 테이블 없음'
  END AS profiles_status;

-- 2. profiles.children 컬럼 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'children'
    )
    THEN '✅ children 컬럼 존재'
    ELSE '❌ children 컬럼 없음 - 추가 필요'
  END AS children_column_status;

-- 3. children 테이블 확인
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'children')
    THEN '⚠️ children 테이블 존재 - 마이그레이션 필요'
    ELSE '✅ children 테이블 없음 (정상)'
  END AS children_table_status;
```

---

## 실행해야 할 SQL (상황별)

### 최소한 실행해야 할 SQL

```sql
-- profiles 테이블에 children 컬럼 추가 (없는 경우)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- JSONB 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_children 
ON public.profiles USING GIN (children);
```

이 두 줄만 실행해도 기본적으로 작동합니다!

---

## 완료 확인

모든 설정이 완료되었는지 확인:

```sql
-- profiles 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

`children` 컬럼이 `jsonb` 타입으로 보이면 완료입니다!
