// 04_checklist 체크리스트 문항 데이터 (기획서 10~18장 원문 그대로)

const CHECKLIST_CATEGORIES = [
  {
    id: 'category01',
    title: '01. 집에 들어가기 전',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: '건물 및 주변 환경',
        items: [
          { id: 'item01', text: '건물 입구와 공용공간이 전반적으로 깨끗하다.' },
          { id: 'item02', text: '현관 및 복도에서 심한 담배·음식물·하수구 냄새가 나지 않는다.' },
          { id: 'item03', text: '공동현관 및 출입 보안 상태가 적절하다.' },
          { id: 'item04', text: 'CCTV 또는 기본적인 보안시설이 확인된다.' },
          { id: 'item05', text: '쓰레기 적치 상태가 심각하지 않다.' },
          { id: 'item06', text: '집 주변에 지나치게 시끄러운 시설이 없다.' },
          { id: 'item07', text: '집까지 오는 길에 심한 언덕이나 불편한 동선이 없다.' },
          { id: 'item08', text: '역·버스정류장까지 실제 이동이 가능해 보인다.' }
        ]
      }
    ]
  },
  {
    id: 'category02',
    title: '02. 집에 들어가자마자',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: '채광·환기·냄새',
        items: [
          { id: 'item01', text: '집 안이 지나치게 어둡지 않다.' },
          { id: 'item02', text: '주요 생활공간에 자연광이 들어온다.' },
          { id: 'item03', text: '앞 건물이 지나치게 가까워 시야가 막히지 않는다.' },
          { id: 'item04', text: '창문을 열 수 있고 환기가 가능하다.' },
          { id: 'item05', text: '맞통풍이 가능하거나 환기 구조가 적절하다.' },
          { id: 'item06', text: '집 안에 곰팡이 냄새가 나지 않는다.' },
          { id: 'item07', text: '하수구 냄새가 나지 않는다.' },
          { id: 'item08', text: '담배·반려동물 등 제거하기 어려운 냄새가 심하지 않다.' },
          { id: 'item09', text: '방향제나 향초 냄새가 지나치게 강하지 않다.' }
        ]
      }
    ]
  },
  {
    id: 'category03',
    title: '03. 벽·천장·창문',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: '곰팡이·결로·누수 확인',
        items: [
          { id: 'item01', text: '벽지에 검은 곰팡이 흔적이 없다.' },
          { id: 'item02', text: '벽지가 들뜨거나 울어 있는 곳이 없다.' },
          { id: 'item03', text: '벽이나 천장에 누런 물자국이 없다.' },
          { id: 'item04', text: '천장에 누수 흔적이 없다.' },
          { id: 'item05', text: '창문 주변에 곰팡이가 심하지 않다.' },
          { id: 'item06', text: '창틀에 물이 고였던 흔적이 없다.' },
          { id: 'item07', text: '특정 부분만 최근에 새로 도배한 흔적이 의심스럽지 않다.' },
          { id: 'item08', text: '붙박이장 내부에 곰팡이나 습기가 없다.' }
        ]
      },
      {
        heading: '창문',
        items: [
          { id: 'item09', text: '모든 주요 창문이 정상적으로 열린다.' },
          { id: 'item10', text: '창문 잠금장치가 정상적으로 작동한다.' },
          { id: 'item11', text: '방충망이 심하게 손상되지 않았다.' },
          { id: 'item12', text: '창틀 또는 창문 틈이 지나치게 벌어져 있지 않다.' }
        ]
      }
    ]
  },
  {
    id: 'category04',
    title: '04. 소음 확인',
    notice: '잠시 말을 멈추고 약 30초 정도 주변 소리를 들어보세요.',
    hasNoiseLevel: true,
    noiseLevelOptions: ['매우 조용함', '보통', '약간 신경 쓰임', '거주하기 어려운 수준'],
    hasMemo: true,
    sections: [
      {
        heading: null,
        items: [
          { id: 'item01', text: '도로 차량 소음이 감당 가능한 수준이다.' },
          { id: 'item02', text: '오토바이·배달 차량 소음이 심하지 않다.' },
          { id: 'item03', text: '주변 상가나 술집 등의 소음이 심하지 않다.' },
          { id: 'item04', text: '옆집의 생활소음이 지나치게 잘 들리지 않는다.' },
          { id: 'item05', text: '위층 발걸음이나 충격음이 심하지 않다.' },
          { id: 'item06', text: '엘리베이터 또는 기계설비 소리가 심하지 않다.' },
          { id: 'item07', text: '배관에서 물 흐르는 소리가 과도하게 들리지 않는다.' }
        ]
      }
    ]
  },
  {
    id: 'category05',
    title: '05. 수도·온수·배수',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: '주방',
        items: [
          { id: 'item01', text: '싱크대 수압이 충분하다.' },
          { id: 'item02', text: '온수가 정상적으로 나온다.' },
          { id: 'item03', text: '물이 빠르게 배수된다.' },
          { id: 'item04', text: '싱크대 아래쪽에 누수 흔적이 없다.' },
          { id: 'item05', text: '싱크대 하부장에서 하수구 또는 곰팡이 냄새가 나지 않는다.' }
        ]
      },
      {
        heading: '화장실',
        items: [
          { id: 'item06', text: '샤워기 수압이 충분하다.' },
          { id: 'item07', text: '온수가 정상적으로 나온다.' },
          { id: 'item08', text: '세면대 물이 잘 내려간다.' },
          { id: 'item09', text: '변기 물이 정상적으로 내려간다.' },
          { id: 'item10', text: '바닥 배수가 원활하다.' },
          { id: 'item11', text: '배수구에서 심한 냄새가 올라오지 않는다.' }
        ]
      }
    ]
  },
  {
    id: 'category06',
    title: '06. 화장실',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: null,
        items: [
          { id: 'item01', text: '환풍기가 정상적으로 작동한다.' },
          { id: 'item02', text: '천장에 곰팡이가 심하지 않다.' },
          { id: 'item03', text: '타일이 심하게 깨지거나 들뜬 곳이 없다.' },
          { id: 'item04', text: '실리콘 부분에 심한 곰팡이가 없다.' },
          { id: 'item05', text: '변기가 흔들리지 않는다.' },
          { id: 'item06', text: '세면대나 수전 주변에서 물이 새지 않는다.' },
          { id: 'item07', text: '샤워 후 물이 고일 것 같은 구조가 아니다.' }
        ]
      }
    ]
  },
  {
    id: 'category07',
    title: '07. 냉난방·전기',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: null,
        items: [
          { id: 'item01', text: '보일러 또는 난방장치가 정상적으로 보인다.' },
          { id: 'item02', text: '난방 조절기를 사용할 수 있다.' },
          { id: 'item03', text: '에어컨이 포함된 경우 상태가 양호하다.' },
          { id: 'item04', text: '에어컨 내부에 심한 곰팡이가 보이지 않는다.' },
          { id: 'item05', text: '주요 공간에 콘센트가 충분하다.' },
          { id: 'item06', text: '콘센트 위치가 실제 가구 배치에 적절하다.' },
          { id: 'item07', text: '전등과 스위치가 정상적으로 작동한다.' },
          { id: 'item08', text: '분전반이 심하게 노후돼 보이지 않는다.' }
        ]
      }
    ]
  },
  {
    id: 'category08',
    title: '08. 문·수납·공간',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: null,
        items: [
          { id: 'item01', text: '현관문이 정상적으로 닫히고 잠긴다.' },
          { id: 'item02', text: '방문과 화장실 문이 정상적으로 열린다.' },
          { id: 'item03', text: '문이 바닥에 심하게 끌리지 않는다.' },
          { id: 'item04', text: '생활에 필요한 수납공간이 충분하다.' },
          { id: 'item05', text: '옷장 또는 붙박이장 깊이가 충분하다.' },
          { id: 'item06', text: '신발장 공간이 충분하다.' },
          { id: 'item07', text: '냉장고를 놓을 수 있다.' },
          { id: 'item08', text: '세탁기를 놓을 수 있다.' },
          { id: 'item09', text: '침대 또는 주요 가구를 배치할 공간이 충분하다.' },
          { id: 'item10', text: '가구를 놓았을 때 이동 동선이 지나치게 좁아지지 않는다.' }
        ]
      }
    ]
  },
  {
    id: 'category09',
    title: '09. 통신·생활 편의',
    notice: null,
    hasMemo: true,
    sections: [
      {
        heading: null,
        items: [
          { id: 'item01', text: '휴대폰 통신 상태가 양호하다.' },
          { id: 'item02', text: '인터넷 설치에 문제가 없다.' },
          { id: 'item03', text: '음식물쓰레기 배출 장소를 확인했다.' },
          { id: 'item04', text: '일반쓰레기 및 재활용 배출 장소를 확인했다.' },
          { id: 'item05', text: '편의점·마트 등 기본 생활시설 접근성이 괜찮다.' },
          { id: 'item06', text: '늦은 시간 귀가 동선이 지나치게 위험해 보이지 않는다.' }
        ]
      }
    ]
  }
];

const FOLLOW_UP_OPTIONS = [
  { id: 'mold', text: '곰팡이 / 결로' },
  { id: 'leak', text: '누수' },
  { id: 'noise', text: '소음' },
  { id: 'managementFee', text: '관리비' },
  { id: 'parking', text: '주차' },
  { id: 'internet', text: '인터넷' },
  { id: 'heatingCooling', text: '냉난방' },
  { id: 'repair', text: '수리 여부' },
  { id: 'other', text: '기타' }
];

const FINAL_DECISION_OPTIONS = [
  '적극적으로 계약 검토',
  '다른 집과 비교 후 결정',
  '조건 협의가 가능하면 검토',
  '계약하지 않는 편이 좋음'
];

function getTotalChecklistItemCount() {
  return CHECKLIST_CATEGORIES.reduce((sum, category) => {
    const itemCount = category.sections.reduce((s, section) => s + section.items.length, 0);
    return sum + itemCount;
  }, 0);
}
