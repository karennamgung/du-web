# 아이 정보 저장 방식 비교

## 방식 1: JSONB 배열 (현재 방식)

```sql
children JSONB DEFAULT '[]'::jsonb
-- 예: [{"name": "김철수", "birth_year": 2015, ...}, {"name": "김영희", ...}]
```

### 장점 ✅
- **동적 확장**: 아이 수에 제한 없음 (1명, 2명, 10명 모두 가능)
- **스키마 변경 불필요**: 아이 추가/삭제 시 ALTER TABLE 불필요
- **간단한 구조**: 하나의 컬럼으로 관리
- **유연함**: 나중에 필드 추가/제거가 쉬움

### 단점 ❌
- **쿼리 복잡**: 특정 조건 검색이 어려움
  ```sql
  -- 예: 2015년생 아이 찾기 (복잡함)
  SELECT * FROM profiles WHERE children @> '[{"birth_year": 2015}]'::jsonb;
  ```
- **인덱싱 제한**: GIN 인덱스는 있지만 특정 필드 인덱싱 어려움
- **타입 검증 약함**: birth_year가 숫자가 아닌 문자열로 들어갈 수 있음
- **정렬/필터링 어려움**: SQL에서 직접 정렬하기 복잡

---

## 방식 2: 별도 컬럼 (child1_name, child2_name 등)

```sql
child1_name TEXT,
child1_birth_year INTEGER,
child1_gender TEXT,
child1_education_institution TEXT,
child2_name TEXT,
child2_birth_year INTEGER,
...
```

### 장점 ✅
- **쿼리 간단**: 일반 SQL로 쉽게 검색/정렬
  ```sql
  -- 예: 2015년생 아이 찾기 (간단함)
  SELECT * FROM profiles WHERE child1_birth_year = 2015 OR child2_birth_year = 2015;
  ```
- **인덱싱 쉬움**: 각 컬럼에 인덱스 생성 가능
- **타입 안정성**: 컬럼 타입으로 강제됨
- **성능**: 인덱스 활용이 좋음

### 단점 ❌
- **확장성 제한**: 아이 수가 제한됨 (보통 3-5명 정도)
- **NULL 값 많음**: 아이가 적으면 많은 컬럼이 NULL
- **스키마 변경 필요**: 아이 수가 늘어나면 ALTER TABLE 필요
- **쿼리 복잡**: 여러 아이 검색 시 OR 조건이 많아짐
- **데이터 중복**: 같은 로직을 여러 컬럼에 반복

---

## 방식 3: 별도 테이블 (정규화, 가장 권장)

```sql
CREATE TABLE children (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id),
  name TEXT,
  birth_year INTEGER,
  ...
);
```

### 장점 ✅
- **확장성**: 아이 수 제한 없음
- **쿼리 간단**: JOIN으로 쉽게 검색/정렬
- **인덱싱**: 각 컬럼에 인덱스 가능
- **타입 안정성**: 컬럼 타입으로 강제
- **정규화**: 데이터 중복 없음
- **성능**: 인덱스 활용 최적

### 단점 ❌
- **JOIN 필요**: 프로필과 아이 정보를 함께 보려면 JOIN 필요
- **테이블 관리**: 별도 테이블 관리 필요

---

## 추천

### 현재 상황 (프로필 안에 포함해야 함)

**JSONB 배열 방식이 더 적합합니다** ✅

이유:
1. 아이 수가 동적임 (1명~여러 명)
2. 스키마 변경 없이 확장 가능
3. 프로필과 함께 조회하는 경우가 많음
4. 별도 컬럼 방식은 확장성 문제가 큼

### 만약 쿼리/검색이 중요하다면

**별도 테이블 방식 권장** ✅

이유:
1. 검색/정렬이 쉬움
2. 인덱싱이 효율적
3. 확장성도 좋음
4. 관계형 DB의 정규화 원칙에 부합

---

## 실제 사용 패턴 비교

### 시나리오: "2015년생 아이를 가진 학부모 찾기"

**JSONB 방식:**
```sql
SELECT * FROM profiles 
WHERE children @> '[{"birth_year": 2015}]'::jsonb;
-- 또는
SELECT * FROM profiles p,
  jsonb_array_elements(p.children) AS child
WHERE (child->>'birth_year')::integer = 2015;
```

**별도 컬럼 방식:**
```sql
SELECT * FROM profiles 
WHERE child1_birth_year = 2015 
   OR child2_birth_year = 2015 
   OR child3_birth_year = 2015;
-- 아이가 3명 이상이면 추가 컬럼 필요
```

**별도 테이블 방식:**
```sql
SELECT DISTINCT p.* FROM profiles p
JOIN children c ON c.parent_id = p.id
WHERE c.birth_year = 2015;
-- 가장 간단하고 효율적
```

---

## 최종 추천

### 현재 요구사항: 프로필 안에 포함

→ **JSONB 배열 유지** ✅

### 향후 확장 고려: 검색/필터링이 중요해지면

→ **별도 테이블로 마이그레이션 고려**

---

## 하이브리드 접근 (선택사항)

가장 많이 사용하는 첫 번째 아이만 별도 컬럼으로:

```sql
-- 가장 많이 조회하는 첫 번째 아이
child_name TEXT,
child_birth_year INTEGER,
child_gender TEXT,

-- 나머지 아이들은 JSONB
other_children JSONB DEFAULT '[]'::jsonb
```

하지만 이 방식은 복잡도만 증가시킵니다.
