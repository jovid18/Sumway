# Sumway

> 평가 점수 조합 계산 및 학생 점수 관리 도구

[![Deploy](https://img.shields.io/badge/demo-live-brightgreen)](https://jovid18.github.io/Sumway/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev/)

## Demo

**[https://jovid18.github.io/Sumway/](https://jovid18.github.io/Sumway/)**

## Features

- **평가 항목 관리** - 여러 평가 항목과 평가 요소를 자유롭게 추가/삭제/복사
- **커스텀 이름 지정** - 항목과 평가 요소에 원하는 이름 설정
- **점수 조합 계산** - 각 평가 요소별 점수의 가능한 모든 조합 자동 계산
- **학생 점수 부여** - 전체 점수 입력 시 항목별/요소별 점수 자동 분배
- **균형 잡힌 분배** - 점수 분배 시 균형 잡힌 조합 우선 선택
- **CSV 내보내기** - 학생별 점수 데이터를 CSV 파일로 다운로드
- **자동 저장** - 모든 데이터가 브라우저에 자동 저장

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, DaisyUI
- **Deployment**: GitHub Pages

## Getting Started

```bash
# 저장소 클론
git clone https://github.com/jovid18/Sumway.git
cd Sumway

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## Usage

1. **항목 설정**: 평가 항목과 평가 요소를 추가하고 각각에 가능한 점수들을 입력
2. **이름 지정**: 각 항목과 평가 요소에 의미 있는 이름 부여
3. **계산하기**: "계산하기" 버튼을 눌러 가능한 모든 점수 조합 확인
4. **학생 추가**: 학생을 추가하고 전체 점수를 입력하면 자동으로 세부 점수 분배
5. **CSV 내보내기**: 결과를 CSV 파일로 다운로드

## License

MIT
