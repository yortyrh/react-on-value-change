import { useEffect, useRef } from 'react';

interface QueueItem<T> {
  previous: T;
  current: T;
}

/**
 * How to act when there are several changes.
 */
export enum UseValueChangeReducerEnum {
  /**
   * Reduce all changes to one, then call the function if it actually changes
   */
  REDUCE = 'REDUCE',

  /**
   * Call all changes one by one.
   */
  CALL_ALL = 'CALL_ALL',
}

export interface UseValueChangeOptions {
  frequency?: number;
  reducer?: UseValueChangeReducerEnum;
  abortPromise?: boolean;
}

const defaultOptions: UseValueChangeOptions = {
  frequency: 100,
  reducer: UseValueChangeReducerEnum.REDUCE,
  abortPromise: false,
};

export interface ChangeEvent<T> {
  (current: T, previous: T, abortSignal?: AbortSignal): Promise<void> | void;
}

function listReducers<T>(
  abortSignal: AbortSignal
): Record<
  UseValueChangeReducerEnum,
  (events: QueueItem<T>[], onChange: ChangeEvent<T>) => Promise<void>
> {
  return {
    [UseValueChangeReducerEnum.REDUCE]: async (events, onChange) => {
      if (events.length > 0) {
        const currentValue = events[events.length - 1].current;
        const previousValue = events[0].previous;
        if (currentValue !== previousValue) {
          await onChange(currentValue, previousValue, abortSignal);
        }
      }
    },
    [UseValueChangeReducerEnum.CALL_ALL]: async (events, onChange) => {
      for (const event of events) {
        await onChange(event.current, event.previous, abortSignal);
      }
    },
  };
}

/**
 * Subscribe to value changes and calls the onChange function on avery change.
 * This make sure calls to the onChange method are done in changes order.
 *
 * - Check for changes every 100 millis or use the frequency option.
 * - If several changes were performed:
 *   REDUCE: considering the first and last change, only trigger if the value changed.
 *   CALL_ALL: call the onChange function for each value change, one after the other.
 *
 * @param value
 * @param onChange
 * @param options
 */
export function useValueChange<T>(
  value: T,
  onChange: ChangeEvent<T>,
  {
    frequency = defaultOptions.frequency,
    reducer = defaultOptions.reducer,
    abortPromise = defaultOptions.abortPromise,
  }: UseValueChangeOptions = defaultOptions
) {
  const valueRef = useRef<T>(value);
  const queueRef = useRef<Array<QueueItem<T>>>([]);
  useEffect(() => {
    if (valueRef.current !== value) {
      queueRef.current.push({
        previous: valueRef.current,
        current: value,
      });
      valueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    let running = false;
    let abortController: AbortController;
    let changes: Array<QueueItem<T>> = [];
    const interval = setInterval(async () => {
      if (!running) {
        running = true;
        changes = queueRef.current.splice(0);
        if (changes.length > 0) {
          abortController = new AbortController();
          const reducers = listReducers<T>(abortController.signal);
          try {
            await reducers[reducer || UseValueChangeReducerEnum.REDUCE](
              changes,
              onChange
            );
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              // It is an abort error
            } else {
              console.error('useValueChange failed');
            }
          }
        }
        running = false;
      } else if (
        queueRef.current.length > 0 &&
        changes.length > 0 &&
        abortController &&
        abortPromise
      ) {
        queueRef.current.unshift(...changes);
        abortController.abort();
      }
    }, frequency);
    return () => clearInterval(interval);
  }, []);
}
