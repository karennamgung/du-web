# Supabase 온보딩 기능 설정 가이드

이 가이드는 Supabase에서 온보딩 기능을 위한 테이블과 스토리지 버킷을 설정하는 방법을 설명합니다.

## 목차
1. [Supabase 대시보드 접속](#1-supabase-대시보드-접속)
2. [SQL 에디터에서 테이블 생성](#2-sql-에디터에서-테이블-생성)
3. [스토리지 버킷 생성](#3-스토리지-버킷-생성)
4. [스토리지 정책 설정](#4-스토리지-정책-설정)
5. [확인 및 테스트](#5-확인-및-테스트)

---

## 1. Supabase 대시보드 접속

1. [Supabase 공식 웹사이트](https://supabase.com)에 접속
2. 로그인 후 프로젝트 선택
3. 좌측 사이드바에서 **SQL Editor** 클릭

---

## 2. SQL 에디터에서 테이블 생성

### 방법 A: SQL 파일 사용 (권장)

1. 프로젝트 루트의 `supabase/setup-onboarding.sql` 파일을 열기
2. 파일 내용 전체를 복사
3. Supabase 대시보드 → **SQL Editor**로 이동
4. **New query** 클릭
5. 복사한 SQL 코드를 붙여넣기
6. 우측 상단의 **Run** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)
7. 성공 메시지 확인

### 방법 B: 수동으로 SQL 실행

SQL Editor에서 다음 SQL을 순서대로 실행:

```sql
-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('parent', 'student', 'academy')),
  nickname TEXT NOT NULL,
  profile_image_url TEXT,
  residence TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. children 테이블 생성
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  education_institution TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_parent_order ON public.children(parent_id, "order");

-- 4. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_children_updated_at ON public.children;
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- 7. profiles RLS 정책
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. children RLS 정책
DROP POLICY IF EXISTS "Parents can read own children" ON public.children;
CREATE POLICY "Parents can read own children" ON public.children
  FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can insert own children" ON public.children;
CREATE POLICY "Parents can insert own children" ON public.children
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can update own children" ON public.children;
CREATE POLICY "Parents can update own children" ON public.children
  FOR UPDATE USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can delete own children" ON public.children;
CREATE POLICY "Parents can delete own children" ON public.children
  FOR DELETE USING (auth.uid() = parent_id);
```

### 확인

SQL 실행 후 다음을 확인:

1. 좌측 사이드바 → **Table Editor** 클릭
2. `profiles`와 `children` 테이블이 생성되었는지 확인
3. 각 테이블의 컬럼이 올바르게 생성되었는지 확인

---

## 3. 스토리지 버킷 생성

프로필 이미지를 저장하기 위한 스토리지 버킷을 생성합니다.

1. Supabase 대시보드 좌측 사이드바에서 **Storage** 클릭
2. **Create a new bucket** 버튼 클릭
3. 다음 정보 입력:
   - **Name**: `avatars`
   - **Public bucket**: ✅ 체크 (공개 버킷으로 설정)
   - **File size limit**: `5 MB` (또는 원하는 크기)
   - **Allowed MIME types**: `image/*` (또는 비워두기)
4. **Create bucket** 버튼 클릭

---

## 4. 스토리지 정책 설정

스토리지 버킷에 대한 접근 권한을 설정합니다.

### 4.1 Storage 정책 페이지로 이동

1. Storage 메뉴에서 `avatars` 버킷 클릭
2. **Policies** 탭 클릭

### 4.2 정책 추가

**정책 1: 공개 읽기 (Public Read)**

1. **New Policy** 클릭
2. **For full customization** 선택
3. Policy name: `Public read access`
4. Allowed operation: `SELECT`
5. Policy definition에 다음 SQL 입력:

```sql
bucket_id = 'avatars'
```

6. **Review** 클릭 후 **Save policy** 클릭

**정책 2: 인증된 사용자 업로드 (Authenticated Upload)**

1. **New Policy** 클릭
2. **For full customization** 선택
3. Policy name: `Authenticated users can upload`
4. Allowed operation: `INSERT`
5. Policy definition에 다음 SQL 입력:

```sql
bucket_id = 'avatars' AND auth.role() = 'authenticated'
```

6. **Review** 클릭 후 **Save policy** 클릭

**정책 3: 사용자 자신의 파일만 업데이트/삭제**

1. **New Policy** 클릭
2. **For full customization** 선택
3. Policy name: `Users can update own files`
4. Allowed operation: `UPDATE`
5. Policy definition에 다음 SQL 입력:

```sql
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
```

6. **Review** 클릭 후 **Save policy** 클릭

7. **New Policy** 클릭
8. **For full customization** 선택
9. Policy name: `Users can delete own files`
10. Allowed operation: `DELETE`
11. Policy definition에 다음 SQL 입력:

```sql
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
```

12. **Review** 클릭 후 **Save policy** 클릭

### 대안: 간단한 정책 (개발 환경용)

개발 단계에서는 더 간단한 정책을 사용할 수 있습니다:

**정책 1: 모든 인증된 사용자가 읽기/업로드/업데이트/삭제 가능**

```sql
-- SELECT (읽기)
bucket_id = 'avatars'

-- INSERT (업로드)
bucket_id = 'avatars' AND auth.role() = 'authenticated'

-- UPDATE (업데이트)
bucket_id = 'avatars' AND auth.role() = 'authenticated'

-- DELETE (삭제)
bucket_id = 'avatars' AND auth.role() = 'authenticated'
```

---

## 5. 확인 및 테스트

### 5.1 테이블 확인

1. **Table Editor**에서 `profiles` 테이블 확인
2. **Table Editor**에서 `children` 테이블 확인
3. 각 테이블의 RLS가 활성화되어 있는지 확인

### 5.2 스토리지 확인

1. **Storage** → `avatars` 버킷 확인
2. 버킷이 **Public**으로 설정되어 있는지 확인
3. 정책이 올바르게 설정되었는지 확인

### 5.3 테스트

애플리케이션에서 다음을 테스트:

1. 새 사용자로 회원가입
2. 온보딩 플로우 진행
3. 프로필 이미지 업로드 테스트
4. 프로필 정보가 `profiles` 테이블에 저장되는지 확인
5. 학부모인 경우 아이 정보가 `children` 테이블에 저장되는지 확인

---

## 문제 해결

### 테이블이 생성되지 않는 경우

- SQL 에디터에서 에러 메시지 확인
- 기존 테이블이 있는지 확인 (`DROP TABLE IF EXISTS` 사용)
- 권한 문제인지 확인

### 스토리지 업로드가 실패하는 경우

- 버킷이 Public으로 설정되어 있는지 확인
- 정책이 올바르게 설정되었는지 확인
- 파일 크기 제한 확인
- MIME 타입 제한 확인

### RLS 정책 문제

- `auth.uid()`가 올바르게 작동하는지 확인
- 정책이 활성화되어 있는지 확인
- 테스트 시 인증된 사용자로 로그인했는지 확인

---

## 추가 참고사항

- 프로덕션 환경에서는 더 엄격한 RLS 정책을 사용하는 것을 권장합니다
- 파일 업로드 시 파일 크기와 타입 검증을 클라이언트에서도 수행하는 것이 좋습니다
- 이미지 최적화를 위해 이미지 리사이징을 고려해보세요
