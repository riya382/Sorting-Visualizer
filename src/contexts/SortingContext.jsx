import { createContext, useRef, useState } from "react";

import { getRandomNumber } from "../helpers/math";
import { awaitTimeout } from "../helpers/promises";

export const SortingContext = createContext();
const speedMap = {
  slow: 1000,
  normal: 500,
  fast: 250,
};

const MIN_ARRAY_SIZE = 5;
const MAX_ARRAY_SIZE = 50;
const STEP_POLL_MS = 20;

// Thrown internally to unwind a running sort's async recursion the moment
// the user resets or starts a new array. Caught in startVisualizing.
class SortAborted extends Error {}

function SortingProvider({ children }) {
  const [sortingState, setSortingState] = useState({
    array: [],
    originalArray: [],
    arraySize: 12,
    maxValue: 1000,
    delay: speedMap["slow"],
    algorithm: "bubble_sort",
    sorted: false,
    sorting: false,
    paused: false,
    stepMode: false,
    comparisons: 0,
    swaps: 0,
  });

  // Refs mirror the control-relevant bits of state so the running async
  // sort functions always see the latest value, even mid-await.
  const genRef = useRef(0);
  const pausedRef = useRef(false);
  const stepModeRef = useRef(false);
  const delayRef = useRef(speedMap["slow"]);
  const stepResolverRef = useRef(null);

  const changeBar = (index, payload) => {
    setSortingState((prev) => ({
      ...prev,
      array: prev.array.map((item, i) =>
        i === index ? { ...item, ...payload } : item,
      ),
    }));
  };

  const incrementComparisons = (n = 1) => {
    setSortingState((prev) => ({
      ...prev,
      comparisons: prev.comparisons + n,
    }));
  };

  const incrementSwaps = (n = 1) => {
    setSortingState((prev) => ({ ...prev, swaps: prev.swaps + n }));
  };

  // Releases anything waiting on a manual "next step" click so an aborted
  // sort can actually unwind instead of hanging forever.
  const releasePendingStep = () => {
    if (stepResolverRef.current) {
      const resolve = stepResolverRef.current;
      stepResolverRef.current = null;
      resolve();
    }
  };

  // Called at every point in an algorithm where the original code used to
  // `await awaitTimeout(sortingState.delay)`. Handles abort, pause and
  // step-by-step mode uniformly.
  async function wait(gen) {
    if (genRef.current !== gen) throw new SortAborted();

    if (stepModeRef.current) {
      await new Promise((resolve) => {
        stepResolverRef.current = resolve;
      });
      if (genRef.current !== gen) throw new SortAborted();
      return;
    }

    let remaining = Math.max(delayRef.current, 1);
    while (remaining > 0) {
      if (genRef.current !== gen) throw new SortAborted();

      while (pausedRef.current) {
        if (genRef.current !== gen) throw new SortAborted();
        await awaitTimeout(STEP_POLL_MS);
      }

      const chunk = Math.min(STEP_POLL_MS, remaining);
      await awaitTimeout(chunk);
      remaining -= chunk;
    }

    if (genRef.current !== gen) throw new SortAborted();
  }

  const buildArray = (values, extra = {}) => {
    const maxValue = Math.max(...values, 1);
    return {
      array: values.map((value) => ({ value, state: "idle" })),
      originalArray: values,
      arraySize: values.length,
      maxValue,
      sorted: false,
      sorting: false,
      paused: false,
      comparisons: 0,
      swaps: 0,
      ...extra,
    };
  };

  // Aborts whatever sort might currently be running so a fresh array can
  // safely be installed.
  const interruptRunningSort = () => {
    genRef.current++;
    pausedRef.current = false;
    releasePendingStep();
  };

  const generateSortingArray = (size) => {
    interruptRunningSort();

    setSortingState((prev) => {
      const length = Math.min(
        Math.max(size ?? prev.arraySize, MIN_ARRAY_SIZE),
        MAX_ARRAY_SIZE,
      );
      const values = Array.from({ length }, () => getRandomNumber(60, 1000));
      return { ...prev, ...buildArray(values) };
    });
  };

  // Sets a user-supplied array. Expects an already-parsed array of finite,
  // non-negative numbers (validation happens in the UI).
  const setCustomArray = (values) => {
    interruptRunningSort();

    setSortingState((prev) => ({ ...prev, ...buildArray(values) }));
  };

  // Restores the bars to the array they had before the last sort started,
  // aborting an in-progress sort if there is one, and clears the counters.
  const resetArray = () => {
    interruptRunningSort();

    setSortingState((prev) => ({
      ...prev,
      ...buildArray(prev.originalArray),
    }));
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setSortingState((prev) => ({ ...prev, paused: pausedRef.current }));
  };

  const nextStep = () => {
    releasePendingStep();
  };

  const toggleStepMode = () => {
    setSortingState((prev) => {
      const stepMode = !prev.stepMode;
      stepModeRef.current = stepMode;
      return { ...prev, stepMode };
    });
  };

  const bubbleSort = async (gen) => {
    const arr = sortingState.array.map((item) => item.value);

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        changeBar(j, { state: "selected" });
        changeBar(j + 1, { state: "selected" });
        await wait(gen);

        incrementComparisons();
        if (arr[j] > arr[j + 1]) {
          let temp = arr[j];
          arr[j] = arr[j + 1];
          changeBar(j, { value: arr[j + 1] });
          arr[j + 1] = temp;
          changeBar(j + 1, { value: temp });
          incrementSwaps();
          await wait(gen);
        }

        changeBar(j, { state: "idle" });
        changeBar(j + 1, { state: "idle" });
      }
    }
  };

  const insertionSort = async (gen) => {
    const arr = sortingState.array.map((item) => item.value);

    for (let i = 1; i < arr.length; i++) {
      let current = arr[i];
      let j = i - 1;

      changeBar(i, { value: current, state: "selected" });

      while (j > -1) {
        incrementComparisons();
        if (current >= arr[j]) break;

        arr[j + 1] = arr[j];
        changeBar(j + 1, { value: arr[j], state: "selected" });
        incrementSwaps();
        j--;
        await wait(gen);
        changeBar(j + 2, { value: arr[j + 1], state: "idle" });
      }

      arr[j + 1] = current;
      changeBar(j + 1, { value: current, state: "idle" });
    }
  };

  const selectionSort = async (gen) => {
    const arr = sortingState.array.map((item) => item.value);

    for (let i = 0; i < arr.length; i++) {
      let min = i;
      changeBar(min, { state: "selected" });

      for (let j = i + 1; j < arr.length; j++) {
        changeBar(j, { state: "selected" });
        await wait(gen);

        incrementComparisons();
        if (arr[j] < arr[min]) {
          changeBar(min, { state: "idle" });
          min = j;
          changeBar(min, { state: "selected" });
        } else {
          changeBar(j, { state: "idle" });
        }
      }

      if (min !== i) {
        let temp = arr[i];
        arr[i] = arr[min];
        changeBar(i, { value: arr[min], state: "idle" });
        arr[min] = temp;
        changeBar(min, { value: temp, state: "idle" });
        incrementSwaps();
      } else {
        changeBar(i, { state: "idle" });
        changeBar(min, { state: "idle" });
      }
    }
  };

  const mergeSort = async (gen) => {
    const arr = sortingState.array.map((item) => item.value);
    await mergeSortHelper(arr, gen);
  };
  async function mergeSortHelper(arr, gen, start = 0, end = arr.length - 1) {
    if (start >= end) return;

    const middle = Math.floor((start + end) / 2);
    await mergeSortHelper(arr, gen, start, middle);
    await mergeSortHelper(arr, gen, middle + 1, end);
    await mergeSortMerger(arr, gen, start, middle, end);
  }
  async function mergeSortMerger(arr, gen, start, middle, end) {
    let left = arr.slice(start, middle + 1);
    let right = arr.slice(middle + 1, end + 1);

    let i = 0,
      j = 0,
      k = start;

    while (i < left.length && j < right.length) {
      incrementComparisons();
      if (left[i] < right[j]) {
        changeBar(k, { value: left[i], state: "selected" });
        arr[k++] = left[i++];
      } else {
        changeBar(k, { value: right[j], state: "selected" });
        arr[k++] = right[j++];
      }
      incrementSwaps();
      await wait(gen);
    }

    while (i < left.length) {
      changeBar(k, { value: left[i], state: "selected" });
      arr[k++] = left[i++];
      incrementSwaps();
      await wait(gen);
    }

    while (j < right.length) {
      changeBar(k, { value: right[j], state: "selected" });
      arr[k++] = right[j++];
      incrementSwaps();
      await wait(gen);
    }

    for (let i = start; i <= end; i++) {
      changeBar(i, { value: arr[i], state: "idle" });
    }
  }

  const quickSort = async (gen) => {
    const arr = sortingState.array.map((item) => item.value);
    await quickSortHelper(arr, gen);
  };
  const quickSortHelper = async (arr, gen, start = 0, end = arr.length - 1) => {
    if (start >= end) {
      return;
    }

    const pivot = arr[Math.floor((start + end) / 2)];
    let i = start;
    let j = end;

    while (i <= j) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        incrementComparisons();
        if (arr[i] >= pivot) break;
        i++;
      }
      // eslint-disable-next-line no-constant-condition
      while (true) {
        incrementComparisons();
        if (arr[j] <= pivot) break;
        j--;
      }

      if (i <= j) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        changeBar(i, { value: arr[i], state: "selected" });
        changeBar(j, { value: arr[j], state: "selected" });
        incrementSwaps();

        await wait(gen);

        changeBar(i, { value: arr[i], state: "idle" });
        changeBar(j, { value: arr[j], state: "idle" });
        i++;
        j--;
      }
    }

    await quickSortHelper(arr, gen, start, j);
    await quickSortHelper(arr, gen, i, end);
  };

  const algorithmMap = {
    bubble_sort: bubbleSort,
    insertion_sort: insertionSort,
    selection_sort: selectionSort,
    merge_sort: mergeSort,
    quick_sort: quickSort,
  };

  const startVisualizing = async () => {
    const gen = ++genRef.current;
    pausedRef.current = false;

    setSortingState((prev) => ({
      ...prev,
      sorting: true,
      paused: false,
      sorted: false,
    }));

    try {
      await algorithmMap[sortingState.algorithm](gen);

      if (genRef.current === gen) {
        setSortingState((prev) => ({
          ...prev,
          sorted: true,
          sorting: false,
        }));
      }
    } catch (err) {
      if (!(err instanceof SortAborted)) {
        throw err;
      }
      // Aborted by resetArray / generateSortingArray / setCustomArray,
      // which already put sortingState back into a clean, non-sorting state.
    }
  };

  const changeSortingSpeed = (e) => {
    const delay = speedMap[e.target.value] ?? 500;
    delayRef.current = delay;
    setSortingState((prev) => ({ ...prev, delay }));
  };

  const changeAlgorithm = (algorithm) => {
    setSortingState((prev) => ({
      ...prev,
      algorithm,
    }));
  };

  return (
    <SortingContext.Provider
      value={{
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
        minArraySize: MIN_ARRAY_SIZE,
        maxArraySize: MAX_ARRAY_SIZE,
      }}
    >
      {children}
    </SortingContext.Provider>
  );
}

export default SortingProvider;
