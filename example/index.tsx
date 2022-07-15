import * as React from 'react';
import { useState } from 'react';
import 'react-app-polyfill/ie11';
import * as ReactDOM from 'react-dom';
import { useValueChange } from '../src';

function waitMillis(millis: number): Promise<void> {
  return new Promise<void>((res) => setTimeout(res, millis));
}

async function delayHello(who: string): Promise<string> {
  await waitMillis(500);
  return `Hello ${who}`;
}

const App = () => {
  const [text, setText] = useState('');
  const [greeting, setGreeting] = useState('');

  useValueChange(text, async (value) => {
    console.log('value: ', value);
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
};

ReactDOM.render(<App />, document.getElementById('root'));
