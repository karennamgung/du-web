# Supabase에서 테이블 상태 확인하기

테이블이 어떤 상태인지, 외래 키가 무엇을 참조하는지 확인하는 방법입니다.

## 방법 1: Table Editor에서 확인 (간단)

1. Supabase 대시보드 → **Table Editor** 클릭
2. `children` 테이블 클릭
3. 테이블 구조와 데이터 확인 가능

하지만 외래 키 제약조건은 Table Editor에서 직접 보기 어렵습니다.

## 방법 2: SQL Editor에서 확인 (권장)

### 빠른 확인

1. Supabase 대시보드 → **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 쿼리 중 하나를 실행:

#### 외래 키 확인 (가장 중요!)

```sql
SELECT 
  tc.constraint_name AS "제약조건 이름",
  tc.table_name AS "테이블명",
  kcu.column_name AS "컬럼명",
  ccu.table_name AS "참조 테이블",
  ccu.column_name AS "참조 컬럼"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'children' 
  AND tc.constraint_type = 'FOREIGN KEY';
```

**결과 해석:**
- `참조 테이블`이 `auth.users` → **마이그레이션 필요** ❌
- `참조 테이블`이 `profiles` → **올바른 상태** ✅

#### 전체 확인 (한 번에 모든 정보 확인)

`supabase/CHECK_TABLE_STATUS.sql` 파일의 내용을 복사해 실행하면:
- 외래 키 제약조건
- 테이블 구조
- RLS 정책
- 데이터 무결성
- 데이터 통계

를 한 번에 확인할 수 있습니다.

## 방법 3: Database → Tables에서 확인

1. Supabase 대시보드 → 좌측 사이드바에서 **Database** 클릭
2. **Tables** 클릭
3. `children` 테이블 클릭
4. **Relationships** 탭에서 외래 키 관계 확인

## 확인해야 할 사항

### ✅ 올바른 상태 (마이그레이션 불필요)

```
children.parent_id → profiles.id
```

### ❌ 예전 상태 (마이그레이션 필요)

```
children.parent_id → auth.users.id
```

## 마이그레이션 실행

예전 상태라면:

1. `supabase/migrate-children-to-profiles.sql` 파일 실행
2. 또는 `supabase/MIGRATION_GUIDE.md` 참고

## 문제 해결

### 테이블이 보이지 않는 경우

- Table Editor에서 테이블 목록 확인
- SQL Editor에서 `SELECT * FROM information_schema.tables WHERE table_schema = 'public';` 실행

### 외래 키가 보이지 않는 경우

- SQL Editor에서 위의 쿼리 실행
- Database → Tables → Relationships 탭 확인
