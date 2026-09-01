import { useContext, useEffect, useState } from "react";

import { SortingContext } from "../contexts/SortingContext";
import algorithmInfos from "../data/algorithmInfos";

function SortingChart() {
  const {
    sortingState,
    generateSortingArray,
    setCustomArray,
    resetArray,
    startVisualizing,
    togglePause,
    nextStep,
    toggleStepMode,
    changeSortingSpeed,
    changeAlgorithm,
    minArraySize,
    maxArraySize,
  } = useContext(SortingContext);

  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");

  useEffect(() => {
    generateSortingArray();
  }, []);

  const handleArraySizeChange = (e) => {
    generateSortingArray(parseInt(e.target.value, 10));
  };

  const handleApplyCustomArray = () => {
    const values = customInput
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map(Number);

    if (values.length < 2) {
      setCustomError("Enter at least 2 comma-separated numbers.");
      return;
    }
    if (values.length > maxArraySize) {
      setCustomError(`Enter at most ${maxArraySize} numbers.`);
      return;
    }
    if (values.some((v) => !Number.isFinite(v) || v < 0)) {
      setCustomError(
        "Only non-negative numbers are allowed, e.g. 5, 12, 40, 8",
      );
      return;
    }

    setCustomError("");
    setCustomArray(values);
  };

  return (
    <div className="mt-4 mb-4 flex flex-col items-center">
      <img src="/logo.png" className="max-w-lg mb-6 w-full" />

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          disabled={sortingState.sorting}
          onClick={() => changeAlgorithm("bubble_sort")}
          className={`bg-carbon text-white px-5 py-3 rounded-3xl disabled:opacity-50 disabled:cursor-default ${
            sortingState.algorithm === "bubble_sort"
              ? "bg-turquoise-dark"
              : "hover:bg-carbon-light"
          } transition-all`}
        >
          Bubble Sort
        </button>
        <button
          disabled={sortingState.sorting}
          onClick={() => changeAlgorithm("insertion_sort")}
          className={`bg-carbon text-white px-5 py-3 rounded-3xl disabled:opacity-50 disabled:cursor-default ${
            sortingState.algorithm === "insertion_sort"
              ? "bg-turquoise-dark"
              : "hover:bg-carbon-light"
          } transition-all`}
        >
          Insertion Sort
        </button>
        <button
          disabled={sortingState.sorting}
          onClick={() => changeAlgorithm("selection_sort")}
          className={`bg-carbon text-white px-5 py-3 rounded-3xl disabled:opacity-50 disabled:cursor-default ${
            sortingState.algorithm === "selection_sort"
              ? "bg-turquoise-dark"
              : "hover:bg-carbon-light"
          } transition-all`}
        >
          Selection Sort
        </button>
        <button
          disabled={sortingState.sorting}
          onClick={() => changeAlgorithm("merge_sort")}
          className={`bg-carbon text-white px-5 py-3 rounded-3xl disabled:opacity-50 disabled:cursor-default ${
            sortingState.algorithm === "merge_sort"
              ? "bg-turquoise-dark"
              : "hover:bg-carbon-light"
          } transition-all`}
        >
          Merge Sort
        </button>
        <button
          disabled={sortingState.sorting}
          onClick={() => changeAlgorithm("quick_sort")}
          className={`bg-carbon text-white px-5 py-3 rounded-3xl disabled:opacity-50 disabled:cursor-default ${
            sortingState.algorithm === "quick_sort"
              ? "bg-turquoise-dark"
              : "hover:bg-carbon-light"
          } transition-all`}
        >
          Quick Sort
        </button>
      </div>

      <div className="max-w-3xl w-full">
        <div
          className="mb-4 chart-container"
          style={{ "--bar-count": sortingState.array.length || 1 }}
        >
          <div className="base"></div>
          {sortingState.array.map((bar, i) => (
            <div key={i} className="bar-container">
              <div
                className={`select-none bar bar-${bar.state}`}
                style={{
                  height: `${Math.floor((bar.value / sortingState.maxValue) * 100)}%`,
                }}
              >
                {sortingState.array.length <= 30 && (
                  <p
                    className={
                      bar.state === "idle" ? "text-[#B1D2CF]" : "text-[#D8B7BE]"
                    }
                  >
                    {bar.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Start / Pause / Resume / Step / Reset controls */}
        <div className="flex flex-wrap items-center gap-4 max-w-3xl mb-4">
          {sortingState.sorting && sortingState.stepMode ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 push-btn text-white-light"
            >
              Next Step
            </button>
          ) : sortingState.sorting ? (
            <button
              onClick={togglePause}
              className="px-4 py-2 push-btn text-white-light"
            >
              {sortingState.paused ? "Resume" : "Pause"}
            </button>
          ) : (
            <button
              onClick={startVisualizing}
              className="px-4 py-2 push-btn text-white-light"
            >
              Start
            </button>
          )}

          <button
            onClick={resetArray}
            className="text-white-light hover:brightness-125"
          >
            Reset
          </button>

          <button
            disabled={sortingState.sorting}
            onClick={() => generateSortingArray()}
            className="text-white-light disabled:brightness-75 disabled:cursor-default"
          >
            New Array
          </button>

          <select
            disabled={sortingState.sorting}
            onChange={changeSortingSpeed}
            defaultValue="slow"
            className="ml-auto bg-carbon px-2 py-2 rounded-md cursor-pointer outline-none focus:ring ring-turquoise-dark disabled:brightness-75 disabled:cursor-default"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>

        {/* Comparison / swap counters + step-mode toggle */}
        <div className="flex flex-wrap items-center gap-4 max-w-3xl mb-4 text-sm">
          <span className="bg-carbon px-3 py-1.5 rounded-md">
            Comparisons:{" "}
            <span className="font-bold">{sortingState.comparisons}</span>
          </span>
          <span className="bg-carbon px-3 py-1.5 rounded-md">
            Swaps: <span className="font-bold">{sortingState.swaps}</span>
          </span>
          {sortingState.sorted && (
            <span className="bg-turquoise-dark px-3 py-1.5 rounded-md">
              Sorted!
            </span>
          )}

          <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sortingState.stepMode}
              disabled={sortingState.sorting}
              onChange={toggleStepMode}
              className="cursor-pointer disabled:cursor-default accent-turquoise-dark"
            />
            Step-by-step mode
          </label>
        </div>

        {/* Array size control */}
        <div className="flex items-center gap-4 max-w-3xl mb-4">
          <label htmlFor="array-size" className="whitespace-nowrap">
            Array Size:{" "}
            <span className="font-bold">{sortingState.arraySize}</span>
          </label>
          <input
            id="array-size"
            type="range"
            min={minArraySize}
            max={maxArraySize}
            value={sortingState.arraySize}
            disabled={sortingState.sorting}
            onChange={handleArraySizeChange}
            className="w-full accent-turquoise-dark cursor-pointer disabled:cursor-default"
          />
        </div>

        {/* Custom array input */}
        <div className="flex flex-col gap-2 max-w-3xl mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              disabled={sortingState.sorting}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Custom array, e.g. 5, 12, 40, 8, 21"
              className="flex-1 min-w-[220px] bg-carbon px-3 py-2 rounded-md outline-none focus:ring ring-turquoise-dark disabled:brightness-75 disabled:cursor-default"
            />
            <button
              disabled={sortingState.sorting}
              onClick={handleApplyCustomArray}
              className="bg-carbon px-4 py-2 rounded-md hover:bg-carbon-light transition-all disabled:brightness-75 disabled:cursor-default"
            >
              Set Array
            </button>
          </div>
          {customError && (
            <p className="text-[#FE1F4E] text-sm">{customError}</p>
          )}
        </div>

        <div className="w-full h-0.5 bg-carbon-light mb-4" />
        <div>
          <h1 className="font-bold text-2xl md:text-4xl">
            {algorithmInfos[sortingState.algorithm].name}
          </h1>
          <p className="whitespace-pre-line mb-6">
            {algorithmInfos[sortingState.algorithm].description}
          </p>
          <div className="w-full h-0.5 bg-carbon-light mb-6" />

          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-4 border-r border-carbon-light" rowSpan={2}>
                    Algorithm
                  </th>
                  <th className="px-4 border-r border-carbon-light" colSpan={3}>
                    Time Complexity
                  </th>
                  <th className="px-4">Space Complexity</th>
                </tr>
                <tr className="border-b border-carbon-light">
                  <th className="px-4 pb-2">Best</th>
                  <th className="px-4 pb-2">Average</th>
                  <th className="px-4 pb-2 border-r border-carbon-light">
                    Worst
                  </th>
                  <th className="px-4 pb-2">Worst</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(algorithmInfos).map((key, i) => (
                  <tr
                    key={i}
                    className="hover:bg-carbon-light whitespace-nowrap"
                  >
                    <td
                      className={`px-4 py-1 ${i === 0 ? "pt-2" : ""} border-r border-carbon-light`}
                    >
                      {algorithmInfos[key].name}
                    </td>
                    <td className={`px-4 py-1 ${i === 0 ? "pt-2" : ""}`}>
                      <span
                        className={`px-1.5 py-0.5 rounded-md bg-${algorithmInfos[key].time_complexity.best[1]}`}
                      >
                        {algorithmInfos[key].time_complexity.best[0]}
                      </span>
                    </td>
                    <td className={`px-4 py-1 ${i === 0 ? "pt-2" : ""}`}>
                      <span
                        className={`px-1.5 py-0.5 rounded-md bg-${algorithmInfos[key].time_complexity.average[1]}`}
                      >
                        {algorithmInfos[key].time_complexity.average[0]}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-1 ${i === 0 ? "pt-2" : ""} border-r border-carbon-light`}
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded-md bg-${algorithmInfos[key].time_complexity.worst[1]}`}
                      >
                        {algorithmInfos[key].time_complexity.worst[0]}
                      </span>
                    </td>
                    <td className={`px-4 py-1 ${i === 0 ? "pt-2" : ""}`}>
                      <span
                        className={`px-1.5 py-0.5 rounded-md bg-${algorithmInfos[key].space_complexity[1]}`}
                      >
                        {algorithmInfos[key].space_complexity[0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SortingChart;
