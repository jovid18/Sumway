import { useState } from 'react';

type EvaluationElement = number[];
type Item = EvaluationElement[];

interface Results {
  itemResults: number[][];
  totalResult: number[];
}

const STORAGE_KEY = 'sumway-items';

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

function App() {
  const [items, setItems] = useState<Item[]>(loadItemsFromStorage);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearResults = () => {
    setResults(null);
    setError(null);
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

    setResults({ itemResults, totalResult });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Sumway</h1>

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
      </div>
    </div>
  );
}

export default App;
