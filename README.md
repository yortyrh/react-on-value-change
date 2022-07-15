# React useValueChange &middot; ![](https://github.com/yortyrh/react-on-value-change/actions/workflows/main.yml/badge.svg)

Subscribe to value changes and call the onChange function.
This make sure calls to the onChange method are done in changes order.
The onChange method can be a promise, no additional on change method called if the promise is pending

## Install

```bash
npm install --save @yortyrh/react-on-value-change

//or

yarn add @yortyrh/react-on-value-change
```

## Example

```tsx
import { useValueChange } from "@yortyrh/react-on-value-change";
import { useState } from "react";

function waitMillis(millis: number): Promise<void> {
  return new Promise<void>((res) => setTimeout(res, millis));
}

async function delayHello(who: string): Promise<string> {
  await waitMillis(500);
  return `Hello ${who}`;
}

export function Sample() {
  const [text, setText] = useState("");
  const [greeting, setGreeting] = useState("");

  useValueChange(text, async (value) => {
    console.log("value: ", value);
    setGreeting(await delayHello(value));
  });

  return (
    <div>
      <p>
        <input
          type="text"
          onInput={(ev) => setText((ev.target as HTMLInputElement).value)}
        />
      </p>
      <div>{greeting}</div>
    </div>
  );
}
```
