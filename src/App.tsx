import { useState, useEffect } from 'react';
import { Autocomplete } from './components/Autocomplete';

type EvaluationElement = number[];
type Item = EvaluationElement[];

interface Results {
  itemResults: number[][];
  totalResult: number[];
}

interface Student {
  id: number;
  name: string;
  totalScore: number | null;
  itemScores: number[]; // 각 항목별 배정된 점수
  elementScores: number[][]; // 각 항목의 평가요소별 배정된 점수
}

const STORAGE_KEY = 'sumway-items';
const STUDENTS_STORAGE_KEY = 'sumway-students';

const loadItemsFromStorage = (): Item[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // 파싱 실패 시 기본값 사용
  }
  return [[[0]]];
};

const loadStudentsFromStorage = (): { students: Student[]; nextId: number } => {
  try {
    const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return { students: data.students || [], nextId: data.nextId || 1 };
    }
  } catch {
    // 파싱 실패 시 기본값 사용
  }
  return { students: [], nextId: 1 };
};

function App() {
  const [items, setItems] = useState<Item[]>(loadItemsFromStorage);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedStudents = loadStudentsFromStorage();
  const [students, setStudents] = useState<Student[]>(savedStudents.students);
  const [nextStudentId, setNextStudentId] = useState(savedStudents.nextId);

  // 학생 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(
      STUDENTS_STORAGE_KEY,
      JSON.stringify({ students, nextId: nextStudentId })
    );
  }, [students, nextStudentId]);

  // 전체 점수에서 항목별 점수 조합 찾기
  const findItemCombinations = (
    targetSum: number,
    itemResults: number[][]
  ): number[][] => {
    const combinations: number[][] = [];

    const backtrack = (index: number, currentSum: number, current: number[]) => {
      if (index === itemResults.length) {
        if (currentSum === targetSum) {
          combinations.push([...current]);
        }
        return;
      }

      for (const score of itemResults[index]) {
        if (currentSum + score <= targetSum) {
          current.push(score);
          backtrack(index + 1, currentSum + score, current);
          current.pop();
        }
      }
    };

    backtrack(0, 0, []);
    return combinations;
  };

  // 항목 점수에서 평가요소별 점수 조합 찾기
  const findElementCombinations = (
    targetSum: number,
    elements: number[][]
  ): number[][] => {
    const combinations: number[][] = [];

    const backtrack = (index: number, currentSum: number, current: number[]) => {
      if (index === elements.length) {
        if (currentSum === targetSum) {
          combinations.push([...current]);
        }
        return;
      }

      for (const score of elements[index]) {
        if (currentSum + score <= targetSum) {
          current.push(score);
          backtrack(index + 1, currentSum + score, current);
          current.pop();
        }
      }
    };

    backtrack(0, 0, []);
    return combinations;
  };

  // 표준편차 계산 (점수 균형 측정용)
  const calculateStdDev = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const squaredDiffs = arr.map((x) => Math.pow(x - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length);
  };

  // 균형잡힌 조합 선택 (표준편차가 작은 것들 중 랜덤)
  const selectBalancedCombination = (combinations: number[][]): number[] => {
    if (combinations.length === 0) return [];
    if (combinations.length === 1) return combinations[0];

    // 표준편차 계산 후 정렬
    const withStdDev = combinations.map((combo) => ({
      combo,
      stdDev: calculateStdDev(combo),
    }));
    withStdDev.sort((a, b) => a.stdDev - b.stdDev);

    // 상위 30% 중에서 랜덤 선택 (균형잡힌 것들 중 랜덤)
    const topCount = Math.max(1, Math.ceil(withStdDev.length * 0.3));
    const topCombinations = withStdDev.slice(0, topCount);
    const randomIndex = Math.floor(Math.random() * topCombinations.length);
    return topCombinations[randomIndex].combo;
  };

  // 학생 관리
  const addStudent = () => {
    setStudents([
      ...students,
      {
        id: nextStudentId,
        name: `학생 ${nextStudentId}`,
        totalScore: null,
        itemScores: [],
        elementScores: [],
      },
    ]);
    setNextStudentId(nextStudentId + 1);
  };

  const removeStudent = (id: number) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const updateStudentName = (id: number, name: string) => {
    setStudents(students.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const updateStudentTotalScore = (id: number, score: number | null) => {
    if (score === null || !results) {
      setStudents(
        students.map((s) =>
          s.id === id
            ? { ...s, totalScore: null, itemScores: [], elementScores: [] }
            : s
        )
      );
      return;
    }

    // 항목별 점수 조합 찾기
    const itemCombinations = findItemCombinations(score, results.itemResults);
    if (itemCombinations.length === 0) return;

    // 균형잡힌 항목 점수 조합 선택
    const selectedItemScores = selectBalancedCombination(itemCombinations);

    // 각 항목에 대해 평가요소별 점수 조합 찾기
    const elementScores: number[][] = [];
    for (let i = 0; i < items.length; i++) {
      const elementCombinations = findElementCombinations(
        selectedItemScores[i],
        items[i]
      );
      const selectedElements = selectBalancedCombination(elementCombinations);
      elementScores.push(selectedElements);
    }

    setStudents(
      students.map((s) =>
        s.id === id
          ? {
              ...s,
              totalScore: score,
              itemScores: selectedItemScores,
              elementScores,
            }
          : s
      )
    );
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  // 전체 초기화
  const resetAll = () => {
    setItems([[[0]]]);
    setResults(null);
    setError(null);
    setStudents([]);
    setNextStudentId(1);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STUDENTS_STORAGE_KEY);
  };

  // CSV 내보내기
  const exportToCSV = () => {
    if (students.length === 0) return;

    // 헤더 생성
    const headers: string[] = ['학생 이름'];
    items.forEach((item, itemIndex) => {
      item.forEach((_, elemIndex) => {
        headers.push(`항목${itemIndex + 1}-요소${elemIndex + 1}`);
      });
      headers.push(`항목${itemIndex + 1} 총합`);
    });
    headers.push('전체 총합');

    // 데이터 행 생성
    const rows = students.map((student) => {
      const row: (string | number)[] = [student.name];

      items.forEach((item, itemIndex) => {
        item.forEach((_, elemIndex) => {
          const score = student.elementScores[itemIndex]?.[elemIndex];
          row.push(score ?? '');
        });
        row.push(student.itemScores[itemIndex] ?? '');
      });

      row.push(student.totalScore ?? '');
      return row;
    });

    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // BOM 추가 (한글 지원)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 다운로드
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `학생점수_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 항목 관리
  const addItem = () => {
    setItems([...items, [[0]]]);
    clearResults();
  };

  const removeItem = (itemIndex: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== itemIndex));
    clearResults();
  };

  // 평가 요소 관리
  const addEvaluationElement = (itemIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex] = [...newItems[itemIndex], [0]];
    setItems(newItems);
    clearResults();
  };

  const removeEvaluationElement = (itemIndex: number, elementIndex: number) => {
    if (items[itemIndex].length <= 1) return;
    const newItems = [...items];
    newItems[itemIndex] = newItems[itemIndex].filter((_, i) => i !== elementIndex);
    setItems(newItems);
    clearResults();
  };

  // 숫자 관리
  const addNumber = (itemIndex: number, elementIndex: number) => {
    const newItems = [...items];
    const currentNumbers = newItems[itemIndex][elementIndex];

    let newValue = 0;
    // 두 개 이상이고 마지막 두 숫자가 유효하면 등차수열 적용
    if (currentNumbers.length >= 2) {
      const last = currentNumbers[currentNumbers.length - 1];
      const secondLast = currentNumbers[currentNumbers.length - 2];
      if (last > 0 && secondLast > 0 && !isNaN(last) && !isNaN(secondLast)) {
        const diff = last - secondLast;
        newValue = last + diff;
      }
    }

    newItems[itemIndex][elementIndex] = [...currentNumbers, newValue];
    setItems(newItems);
    clearResults();
  };

  const removeNumber = (itemIndex: number, elementIndex: number, numIndex: number) => {
    if (items[itemIndex][elementIndex].length <= 1) return;
    const newItems = [...items];
    newItems[itemIndex][elementIndex] = newItems[itemIndex][elementIndex].filter(
      (_, i) => i !== numIndex
    );
    setItems(newItems);
    clearResults();
  };

  const updateNumber = (
    itemIndex: number,
    elementIndex: number,
    numIndex: number,
    value: string
  ) => {
    const newItems = [...items];
    newItems[itemIndex][elementIndex][numIndex] = value === '' ? 0 : Number(value);
    setItems(newItems);
    clearResults();
  };

  // 유효성 검사
  const validate = (): boolean => {
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].length; j++) {
        for (let k = 0; k < items[i][j].length; k++) {
          const num = items[i][j][k];
          if (num <= 0 || isNaN(num)) {
            setError(
              `항목 ${i + 1}의 평가 요소 ${j + 1}의 ${
                k + 1
              }번째 숫자가 유효하지 않습니다. (0 초과 숫자 필요)`
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  // 카테시안 곱 계산 헬퍼
  const calculateCartesianSum = (sets: number[][]): number[] => {
    if (sets.length === 0) return [];
    let sums: number[] = sets[0];

    for (let i = 1; i < sets.length; i++) {
      const newSums: number[] = [];
      for (const sum of sums) {
        for (const num of sets[i]) {
          newSums.push(sum + num);
        }
      }
      sums = newSums;
    }

    return [...new Set(sums)].sort((a, b) => b - a);
  };

  // 전체 계산
  const calculateCombinations = () => {
    if (!validate()) return;

    // 각 항목별 결과 계산
    const itemResults: number[][] = items.map((item) => calculateCartesianSum(item));

    // 전체 결과 계산 (모든 항목 결과의 카테시안 곱)
    const totalResult = calculateCartesianSum(itemResults);

    // localStorage에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    // 학생 초기화 (결과가 바뀌면 기존 점수 무효)
    setStudents([]);
    setNextStudentId(1);

    setResults({ itemResults, totalResult });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div></div>
          <h1 className="text-4xl font-bold">Sumway</h1>
          <button
            className="btn btn-sm px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white border-none shadow-md"
            onClick={resetAll}
          >
            전체 초기화
          </button>
        </div>

        <div className="space-y-8">
          {items.map((item, itemIndex) => (
            <div key={itemIndex} className="space-y-2">
              <div className="card bg-white shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title text-2xl">항목 {itemIndex + 1}</h2>
                    <button
                      className="btn btn-sm px-4 py-2 bg-red-500 hover:bg-red-600 text-white border-none shadow-md"
                      onClick={() => removeItem(itemIndex)}
                      disabled={items.length <= 1}
                    >
                      항목 삭제
                    </button>
                  </div>

                  <div className="space-y-4 pl-4 border-l-4 border-purple-300">
                    {item.map((element, elementIndex) => (
                      <div key={elementIndex} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-700">
                            평가 요소 {elementIndex + 1}
                          </h3>
                          <button
                            className="btn btn-xs px-3 py-1 bg-red-400 hover:bg-red-500 text-white border-none"
                            onClick={() => removeEvaluationElement(itemIndex, elementIndex)}
                            disabled={item.length <= 1}
                          >
                            삭제
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          {element.map((num, numIndex) => (
                            <div key={numIndex} className="flex items-center gap-1">
                              <input
                                type="number"
                                className="input input-bordered input-sm w-20 bg-white"
                                value={num || ''}
                                onChange={(e) =>
                                  updateNumber(itemIndex, elementIndex, numIndex, e.target.value)
                                }
                                min="1"
                                placeholder="숫자"
                              />
                              <button
                                className="btn btn-xs btn-circle bg-gray-300 hover:bg-red-400 hover:text-white border-none"
                                onClick={() => removeNumber(itemIndex, elementIndex, numIndex)}
                                disabled={element.length <= 1}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            className="btn btn-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white border-none"
                            onClick={() => addNumber(itemIndex, elementIndex)}
                          >
                            + 숫자
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      className="btn btn-sm px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white border-none shadow-md"
                      onClick={() => addEvaluationElement(itemIndex)}
                    >
                      + 평가 요소 추가
                    </button>
                  </div>
                </div>
              </div>

              {results && results.itemResults[itemIndex] && (
                <div className="card bg-gray-100 shadow-md ml-4">
                  <div className="card-body py-3">
                    <h3 className="font-semibold text-gray-600">
                      → 결과 ({results.itemResults[itemIndex].length}개)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.itemResults[itemIndex].map((num, j) => (
                        <span key={j} className="badge badge-md badge-secondary">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            className="btn px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-lg"
            onClick={addItem}
          >
            + 항목 추가
          </button>
          <button
            className="btn px-6 py-3 bg-green-500 hover:bg-green-600 text-white border-none shadow-lg"
            onClick={calculateCombinations}
          >
            계산하기
          </button>
        </div>

        {error && (
          <div className="alert alert-error mt-6">
            <span>{error}</span>
          </div>
        )}

        {results && (
          <div className="card bg-primary text-primary-content shadow-xl mt-8">
            <div className="card-body">
              <h2 className="card-title text-xl">전체 결과 ({results.totalResult.length}개)</h2>
              <div className="flex flex-wrap gap-2">
                {results.totalResult.map((num, i) => (
                  <span key={i} className="badge badge-lg bg-white text-primary">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="card bg-white shadow-xl mt-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl">학생 점수 부여</h2>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm px-4 py-2 bg-green-500 hover:bg-green-600 text-white border-none shadow-md"
                    onClick={addStudent}
                  >
                    + 학생 추가
                  </button>
                  <button
                    className="btn btn-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white border-none shadow-md disabled:opacity-50"
                    onClick={exportToCSV}
                    disabled={students.length === 0}
                  >
                    CSV 내보내기
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  학생을 추가해주세요
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-center w-16">#</th>
                        <th>이름</th>
                        <th className="w-40">전체 점수</th>
                        {items.map((_, itemIndex) => (
                          <th key={itemIndex} className="text-center">
                            항목 {itemIndex + 1}
                          </th>
                        ))}
                        <th className="text-center w-20">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="text-center font-medium">{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm w-full max-w-xs bg-white"
                              value={student.name}
                              onChange={(e) => updateStudentName(student.id, e.target.value)}
                              placeholder="학생 이름"
                            />
                          </td>
                          <td>
                            <Autocomplete
                              options={results.totalResult}
                              value={student.totalScore}
                              onChange={(score) => updateStudentTotalScore(student.id, score)}
                              placeholder="점수 입력..."
                            />
                          </td>
                          {items.map((_, itemIndex) => (
                            <td key={itemIndex} className="text-center">
                              {student.itemScores[itemIndex] !== undefined ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-primary">
                                    {student.itemScores[itemIndex]}점
                                  </div>
                                  {student.elementScores[itemIndex] && (
                                    <div className="flex flex-wrap gap-1 justify-center">
                                      {student.elementScores[itemIndex].map(
                                        (elemScore, elemIndex) => (
                                          <span
                                            key={elemIndex}
                                            className="badge badge-sm badge-outline"
                                            title={`평가요소 ${elemIndex + 1}`}
                                          >
                                            {elemScore}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-circle bg-red-500 hover:bg-red-600 text-white border-none"
                              onClick={() => removeStudent(student.id)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
