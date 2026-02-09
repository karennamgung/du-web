# children 테이블 마이그레이션 가이드

기존에 `children` 테이블이 `auth.users`를 참조하고 있다면, `profiles` 테이블을 참조하도록 변경해야 합니다.

## 마이그레이션이 필요한 경우

다음 중 하나에 해당하면 마이그레이션이 필요합니다:

1. ✅ 이미 `children` 테이블이 생성되어 있음
2. ✅ `children.parent_id`가 `auth.users(id)`를 참조하고 있음
3. ✅ 데이터가 이미 존재함

## 마이그레이션 실행 방법

### 방법 1: SQL 파일 사용 (권장)

1. Supabase 대시보드 → **SQL Editor** 클릭
2. **New query** 클릭
3. `supabase/migrate-children-to-profiles.sql` 파일 내용을 복사해 붙여넣기
4. 우측 상단의 **Run** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)
5. 성공 메시지 확인

### 방법 2: 단계별 실행

문제가 발생하면 단계별로 실행할 수 있습니다:

#### 1단계: 현재 상태 확인

```sql
-- 현재 외래 키 확인
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'children' 
  AND tc.constraint_type = 'FOREIGN KEY';
```

#### 2단계: 데이터 무결성 확인

```sql
-- 프로필 없이 아이가 등록된 경우 확인
SELECT COUNT(*) as orphan_count
FROM public.children c
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = c.parent_id
);
```

만약 `orphan_count`가 0보다 크면, 먼저 프로필을 생성해야 합니다.

#### 3단계: 마이그레이션 실행

`migrate-children-to-profiles.sql` 파일의 내용을 실행합니다.

## 마이그레이션 전 체크리스트

- [ ] `profiles` 테이블이 생성되어 있음
- [ ] 모든 사용자가 프로필을 가지고 있음 (없으면 먼저 프로필 생성 필요)
- [ ] 데이터 백업 (선택사항이지만 권장)

## 문제 해결

### 에러: "데이터 무결성 오류: X개의 아이 레코드가 프로필을 찾을 수 없습니다"

**원인**: 일부 아이 레코드의 `parent_id`가 `profiles` 테이블에 존재하지 않음

**해결 방법**:

1. 프로필 없는 사용자 확인:
```sql
SELECT DISTINCT c.parent_id
FROM public.children c
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = c.parent_id
);
```

2. 해당 사용자들의 프로필 생성 (온보딩 완료) 또는
3. 해당 아이 레코드 삭제

### 에러: "constraint does not exist"

**원인**: 외래 키 제약조건이 이미 삭제되었거나 다른 이름을 가지고 있음

**해결 방법**: 
- 에러를 무시하고 계속 진행하거나
- 실제 제약조건 이름 확인 후 수정

### RLS 정책 에러

**원인**: RLS 정책이 이미 존재하거나 다른 이름을 가지고 있음

**해결 방법**: 
- `DROP POLICY IF EXISTS`를 사용하므로 대부분 자동으로 처리됨
- 수동으로 정책 삭제 후 재생성

## 마이그레이션 후 확인

마이그레이션이 성공적으로 완료되었는지 확인:

```sql
-- 외래 키가 profiles를 참조하는지 확인
SELECT 
  tc.constraint_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'children' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'profiles';
```

결과가 나오면 성공입니다!

## 롤백 (필요한 경우)

마이그레이션을 되돌리려면:

```sql
-- 외래 키 제약조건 삭제
ALTER TABLE public.children
  DROP CONSTRAINT IF EXISTS children_parent_id_fkey;

-- auth.users 참조로 복원
ALTER TABLE public.children
  ADD CONSTRAINT children_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- RLS 정책 복원
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
