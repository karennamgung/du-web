# 학원 주소 저장 가이드

새 학원을 DB에 넣을 때 **표시용 주소**와 **필터용 정규화 주소**를 함께 넣어야 위치 선택/지도 필터가 정상 동작합니다.

---

## 1. 컬럼 정리

| 컬럼 | 용도 | 예시 |
|------|------|------|
| `address` | 지번 주소 (표시용) | `인천 연수구 송도2동 123-1` |
| `address_road` | 도로명 주소 (표시용) | `인천 연수구 송도대로 123` |
| `address_sido` | 시/도 (필터용, **address.ts와 동일 문자열**) | `인천` |
| `address_gugun` | 구/군/시 (필터용) | `연수구` |
| `address_dong` | 동/면/읍 (필터용, 구 전체면 NULL 가능) | `송도동` |

- **표시용**: `address`, `address_road` → 화면/지도에 그대로 노출.
- **필터용**: `address_sido`, `address_gugun`, `address_dong` → 앱의 `src/constants/address.ts`에 있는 값과 **완전히 동일**하게 넣어야 함.

---

## 2. 값을 어디서 가져올지

- **시/도**: `address.ts`의 `SIDO_ORDER` (서울, 경기, 인천, …).
- **구/군/시**: `getGugunBySido(sido)` 결과 (예: 인천 → 연수구, 남동구, …).
- **동/면**: `getDongBySidoGugun(sido, gugun)` 결과 (예: 인천+연수구 → 송도동, 연수동, …).  
  구 전체만 쓰면 `address_dong`은 NULL로 두면 됨.

파일 위치: `src/constants/address.ts`  
(새 지역 추가 시 이 파일에 시/도·구·동 목록을 먼저 추가한 뒤 DB에 같은 문자열로 저장.)

---

## 3. SQL로 새 학원 넣을 때

### INSERT 예시 (정규화 컬럼 포함)

```sql
INSERT INTO public.academies (
  name, address, address_road,
  address_sido, address_gugun, address_dong,
  lat, lng, subjects, age_group, image_url
) VALUES (
  '학원이름',
  '인천 연수구 송도2동 123-1',        -- 지번 (표시용)
  '인천 연수구 송도대로 123',          -- 도로명 (표시용)
  '인천', '연수구', '송도동',          -- 필터용 (address.ts와 동일)
  37.3820, 126.6520,
  ARRAY['영어','수학'],
  ARRAY['초등','중등'],
  'https://...'
);
```

### UPDATE 예시 (기존 학원 주소 수정 시)

```sql
UPDATE public.academies
SET
  address       = '인천 남동구 논현동 50',
  address_road  = '인천 남동구 논현로 50',
  address_sido  = '인천',
  address_gugun = '남동구',
  address_dong  = '논현동'
WHERE name = '논현영어학원';
```

- 주소만 바꿀 때도 **항상** `address_sido`, `address_gugun`, `address_dong`을 같이 맞춰 주기.

---

## 4. 일괄 INSERT 후 정규화만 채우는 경우

이미 `address` / `address_road`만 넣고 `address_sido`, `address_gugun`, `address_dong`이 비어 있다면:

1. **수동**: 위 INSERT/UPDATE 패턴으로 시/도·구·동을 채우거나  
2. **백필 스크립트**: `academies-backfill-address-normalized.sql`에 새 지역 규칙을 추가한 뒤, 해당 스크립트를 실행해서 한 번에 채우기.

---

## 5. 주의사항

- **동 이름**: 실제 행정동 기준으로 하되, `address.ts`의 `DONG_BY_SIDO_GUGUN`·`getDongBySidoGugun()`에 있는 문자열과 동일하게 (예: `송도동`, `논현동`).  
  `송도2동`처럼 쓰지 말고, 필터용은 `송도동`으로 통일.
- **구 이름**: 행정구와 `address.ts`를 맞추기.  
  예: 인천 논현동은 **남동구** (연수구 아님).
- **NULL**: `address_dong`은 “구 전체”만 쓰는 경우 NULL로 두면 됨.

이렇게 저장해 두면 위치 선택 모달·지도 필터가 새 학원도 그대로 반영합니다.
