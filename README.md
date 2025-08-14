# React useValueChange &middot; ![](https://github.com/yortyrh/react-on-value-change/actions/workflows/main.yml/badge.svg) [![Netlify Status](https://api.netlify.com/api/v1/badges/1034341c-71c4-4034-8562-d79f383fb2e0/deploy-status)](https://www.netlify.com) [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

Subscribe to value changes and call the onChange function.
This make sure calls to the onChange method are done in changes order.
The onChange method can be a promise, no additional on change method called if the promise is pending

## Install

```bash
npm install --save @yortyrh/react-on-value-change
```

## Example

**Demo:** https://react-on-value-change.netlify.app
```tsx
import * as React from 'react';
import { useValueChange } from '@yortyrh/react-on-value-change';
import './index.scss';

function abortError(message = 'Aborted') {
  return new DOMException(message, 'AbortError');
}

function waitMillis(millis: number, abortSignal?: AbortSignal): Promise<void> {
  return new Promise<void>((res, rej) => {
    let aborted = false;
    const timeout = setTimeout(() => (aborted ? undefined : res()), millis);

    if (abortSignal) {
      abortSignal.onabort = () => {
        aborted = true;
        clearTimeout(timeout);
        rej(abortError());
      };
    }
  });
}

async function delayHello(
  who: string,
  abortSignal?: AbortSignal
): Promise<string> {
  await waitMillis(500, abortSignal);
  return `Hello ${who}`;
}

interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

async function searchMovies(q: string, signal?: AbortSignal): Promise<Movie[]> {
  const response = await fetch(
    `https://www.omdbapi.com/?apikey=63ebddab&s=${q}`,
    { signal }
  );
  const data: { Search?: Movie[] } = await response.json();
  return data.Search || [];
}

const App = () => {
  const [text, setText] = React.useState('');
  const [q, setQ] = React.useState('');
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [greeting, setGreeting] = React.useState('');

  useValueChange(
    text,
    async (value, _previous, abortSignal) => {
      setGreeting(await delayHello(value, abortSignal));
    },
    {
      frequency: 1,
      abortPromise: true,
    }
  );

  useValueChange(
    q,
    async (value, _previous, abortSignal) => {
      setMovies(await searchMovies(value, abortSignal));
    },
    {
      frequency: 1,
      abortPromise: true,
    }
  );

  return (
    <section>
      <h1>React useValueChange examples</h1>
      <article>
        <h2 className="SectionTitle">Hello Who</h2>
        <input
          type="text"
          className="SearchInput"
          onInput={(ev) => setText((ev.target as HTMLInputElement).value)}
        />
        <div className="Greeting">{greeting}</div>
      </article>

      <article>
        <h2 className="SectionTitle">Search Movie</h2>
        <input
          type="text"
          className="SearchInput"
          onInput={(ev) => setQ((ev.target as HTMLInputElement).value)}
        />
        <ul className="Movies">
          {movies.map((movie) => (
            <li key={movie.imdbID} className="Movies__Item">
              <a
                href={`https://www.imdb.com/title/${movie.imdbID}`}
                target="_blank"
                rel="noopener"
                className="Movies__Item__ImgLink"
              >
                <img
                  src={movie.Poster}
                  alt={movie.Title}
                  className="Movies__Item__Img"
                />
              </a>
              <h4>{movie.Title}</h4>
              <p>
                <strong>Type:</strong> {movie.Type}
              </p>
              <p>
                <strong>Year:</strong> {movie.Year}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
};
```
