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
}

const defaultOptions: UseValueChangeOptions = {
  frequency: 100,
  reducer: UseValueChangeReducerEnum.REDUCE,
};

export interface ChangeEvent<T> {
  (current: T, previous: T): Promise<void> | void;
}

function listReducers<T>(): Record<
  UseValueChangeReducerEnum,
  (events: QueueItem<T>[], onChange: ChangeEvent<T>) => Promise<void>
> {
  return {
    [UseValueChangeReducerEnum.REDUCE]: async (events, onChange) => {
      if (events.length > 0) {
        const currentValue = events[events.length - 1].current;
        const previousValue = events[0].previous;
        if (currentValue !== previousValue) {
          await onChange(currentValue, previousValue);
        }
      }
    },
    [UseValueChangeReducerEnum.CALL_ALL]: async (events, onChange) => {
      for (const event of events) {
        await onChange(event.current, event.previous);
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
    const interval = setInterval(async () => {
      if (!running) {
        running = true;
        const changes = queueRef.current.splice(0);
        if (changes.length > 0) {
          const reducers = listReducers<T>();
          await reducers[reducer || UseValueChangeReducerEnum.REDUCE](
            changes,
            onChange
          );
        }
        running = false;
      }
    }, frequency);
    return () => clearInterval(interval);
  }, []);
}
