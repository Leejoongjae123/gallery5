# Aligo 카카오톡/친구톡 연동 진행상황 (2025-06-18)

## 1. 환경변수 (.env.local)
```
ALIGO_API_KEY=zs85l1ken5nyn99z3gmn4o3oli9cpiy1
ALIGO_USER_ID=wonderbest2
ALIGO_SENDER=01086859866
ALIGO_SENDER_KEY=81297db1cf01d6c8e1aeeed6d196a878774ced51
ALIGO_PLUS_ID=@armichelinguide
# 템플릿 승인 완료 후 아래 추가
# ALIGO_TEMPLATE_CODE=AB_1234
```

## 2. 구현된 API 라우트
| 경로 | 기능 | 상태 |
|------|------|------|
| `/api/send-sms` | SMS/LMS 발송 | 완료 |
| `/api/send-ftalk` | 친구톡(FTS/FTI) 발송 | 파라미터 검증 OK, 잔액 부족 단계까지 확인 |
| `/api/send-talk` | 알림톡(ATA) 발송 | **미구현** (템플릿 승인 후 작성) |

## 3. 클라이언트/페이지
* `/sms-test` – SMS 간단 테스트 UI.
* `/ticket` – 주문번호로 QR/주문내역 분기 로직 **설계 완료, 구현 예정**.

## 4. 알림톡 템플릿
* 상태: 심사중
* 버튼 링크(모바일/PC 동일):
  `https://www.artandbridge.com/ticket?order_id=#{주문번호}`

## 5. Git 전략
* 현재 변경사항은 로컬(main) 에만 있음 –> **원격 푸시 금지**
* 승인 완료 후 `feat/aligo-talk` 브랜치에서 개발 → 리뷰 → main 머지 예정.

---

## 이 파일 보는 법
터미널에서 프로젝트 루트 기준:
```bash
cat CONVO_ALIGO.md | less
``` 