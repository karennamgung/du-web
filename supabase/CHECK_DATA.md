# Supabase에서 온보딩 데이터 확인하기

Supabase 대시보드에서 입력된 온보딩 정보를 확인하는 방법입니다.

## 1. Supabase 대시보드 접속

1. [Supabase 공식 웹사이트](https://supabase.com)에 접속
2. 로그인 후 프로젝트 선택
3. 좌측 사이드바에서 **Table Editor** 클릭

## 2. profiles 테이블 확인

### 2.1 테이블 보기

1. **Table Editor**에서 `profiles` 테이블 클릭
2. 테이블의 모든 행(레코드)이 표시됩니다

### 2.2 확인할 수 있는 정보

각 행(사용자)에 대해 다음 정보를 확인할 수 있습니다:

- **id**: 사용자 UUID (auth.users의 id와 동일)
- **user_id**: 사용자 UUID
- **user_type**: 사용자 유형 (`parent`, `student`, `academy`)
- **nickname**: 사용자 별명
- **profile_image_url**: 프로필 이미지 URL (없으면 null)
- **residence**: 거주지 (없으면 null)
- **onboarding_completed**: 온보딩 완료 여부 (`true` 또는 `false`)
- **created_at**: 생성 시간
- **updated_at**: 최종 수정 시간

### 2.3 데이터 필터링

1. 테이블 상단의 **Filter** 버튼 클릭
2. 원하는 조건 설정:
   - 예: `user_type = 'parent'` (학부모만 보기)
   - 예: `onboarding_completed = true` (온보딩 완료된 사용자만 보기)
   - 예: `nickname = '홍길동'` (특정 별명 검색)

### 2.4 데이터 정렬

1. 컬럼 헤더 클릭하여 정렬
2. 예: `created_at` 컬럼 클릭 → 최신순/오래된순 정렬

## 3. children 테이블 확인 (학부모인 경우)

### 3.1 테이블 보기

1. **Table Editor**에서 `children` 테이블 클릭
2. 등록된 모든 아이 정보가 표시됩니다

### 3.2 확인할 수 있는 정보

- **id**: 아이 레코드 UUID
- **parent_id**: 부모 사용자 UUID (profiles 테이블의 user_id와 연결)
- **name**: 아이 이름
- **birth_year**: 출생년도
- **education_institution**: 재원중인 교육기관 (없으면 null)
- **gender**: 성별 (`male`, `female`, 또는 null)
- **order**: 순서 (첫째 아이, 둘째 아이 등)
- **created_at**: 생성 시간
- **updated_at**: 최종 수정 시간

### 3.3 특정 부모의 아이만 보기

1. 테이블 상단의 **Filter** 버튼 클릭
2. `parent_id = '사용자UUID'` 조건 추가
3. 해당 부모의 아이들만 표시됩니다

## 4. SQL Editor에서 쿼리로 확인

더 복잡한 조회가 필요한 경우 SQL Editor를 사용할 수 있습니다.

### 4.1 SQL Editor 열기

1. 좌측 사이드바에서 **SQL Editor** 클릭
2. **New query** 클릭

### 4.2 유용한 쿼리 예시

#### 모든 프로필 확인
```sql
SELECT * FROM profiles
ORDER BY created_at DESC;
```

#### 온보딩 완료된 사용자만 확인
```sql
SELECT * FROM profiles
WHERE onboarding_completed = true
ORDER BY created_at DESC;
```

#### 학부모와 그들의 아이 정보 함께 보기
```sql
SELECT 
  p.nickname as 부모이름,
  p.residence as 거주지,
  c.name as 아이이름,
  c.birth_year as 출생년도,
  c.education_institution as 교육기관,
  c.gender as 성별
FROM profiles p
LEFT JOIN children c ON p.user_id = c.parent_id
WHERE p.user_type = 'parent'
ORDER BY p.created_at DESC, c.order ASC;
```

#### 특정 사용자의 전체 정보 확인
```sql
-- 사용자 UUID를 여기에 입력
SELECT 
  p.*,
  json_agg(c.*) as children
FROM profiles p
LEFT JOIN children c ON p.user_id = c.parent_id
WHERE p.user_id = '사용자UUID'
GROUP BY p.id;
```

#### 온보딩 통계 확인
```sql
SELECT 
  user_type,
  COUNT(*) as 총인원,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as 완료인원,
  COUNT(*) FILTER (WHERE onboarding_completed = false) as 미완료인원
FROM profiles
GROUP BY user_type;
```

#### 아이가 등록된 학부모 수 확인
```sql
SELECT 
  COUNT(DISTINCT parent_id) as 아이등록학부모수,
  COUNT(*) as 총아이수
FROM children;
```

## 5. 데이터 수정/삭제

### 5.1 데이터 수정

1. **Table Editor**에서 해당 행 클릭
2. 수정할 필드 편집
3. **Save** 버튼 클릭

### 5.2 데이터 삭제

1. **Table Editor**에서 삭제할 행 선택
2. 우클릭 → **Delete row** 또는 휴지통 아이콘 클릭
3. 확인 대화상자에서 확인

⚠️ **주의**: 데이터 삭제 시 복구할 수 없습니다. 신중하게 진행하세요.

## 6. 실시간 데이터 확인

### 6.1 실시간 구독 (Realtime)

Supabase는 실시간 업데이트를 지원합니다:

1. **Table Editor**에서 테이블 열기
2. 우측 상단의 **Realtime** 토글 활성화
3. 다른 곳에서 데이터가 추가/수정되면 자동으로 업데이트됩니다

## 7. 문제 해결

### 데이터가 보이지 않는 경우

1. **RLS (Row Level Security) 정책 확인**
   - 좌측 사이드바 → **Authentication** → **Policies**
   - 자신의 사용자 ID로 로그인했는지 확인
   - RLS 정책이 올바르게 설정되었는지 확인

2. **필터 확인**
   - 테이블 상단에 필터가 적용되어 있지 않은지 확인

3. **권한 확인**
   - Supabase 대시보드에 관리자 권한으로 로그인했는지 확인

### 특정 사용자의 데이터만 보이지 않는 경우

- RLS 정책 때문에 자신의 데이터만 볼 수 있을 수 있습니다
- 관리자 권한이 필요하면 SQL Editor에서 직접 쿼리 실행

## 8. 유용한 팁

1. **빠른 검색**: Table Editor 상단의 검색창에서 UUID나 별명으로 검색
2. **컬럼 숨기기/보이기**: 컬럼 헤더 우클릭 → 컬럼 선택
3. **CSV 내보내기**: 테이블 우측 상단의 **Export** 버튼 클릭
4. **데이터 새로고침**: 브라우저 새로고침 또는 테이블 상단의 새로고침 아이콘

---

## 추가 참고사항

- 모든 시간은 UTC 기준으로 저장됩니다
- `updated_at`은 자동으로 업데이트됩니다 (트리거로 관리)
- `id`와 `user_id`는 `auth.users` 테이블의 `id`와 동일합니다
