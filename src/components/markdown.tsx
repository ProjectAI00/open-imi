import Link from "next/link";
import React, { memo, PropsWithChildren } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { PreBlock } from "./pre-block";
import { isJson, isString, toAny } from "lib/utils";
import JsonView from "ui/json-view";

const FadeIn = memo(({ children }: PropsWithChildren) => {
  return <span className="fade-in animate-in duration-1000">{children}</span>;
});

const WordByWordFadeIn = memo(({ children }: PropsWithChildren) => {
  const childrens = isString(children)
    ? children.split(" ")
    : [children].flat();
  return childrens.map((word, index) => <FadeIn key={index}>{word} </FadeIn>);
});

const components: Partial<Components> = {
  code: ({ children }) => {
    return (
      <code className="text-sm rounded-md mx-1 text-blue-400">
        `{children}`
      </code>
    );
  },
  blockquote: ({ children }) => {
    return (
      <blockquote className="relative flex items-center border-accent-foreground/30 border border-dashed p-6 rounded-lg my-6 overflow-hidden">
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-r from-transparent to-background  pointer-events-none" />
      </blockquote>
    );
  },
  p: ({ children }) => {
    return (
      <p className="leading-6 my-4">
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </p>
    );
  },
  pre: ({ children }) => {
    return <PreBlock>{children}</PreBlock>;
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="px-8 list-decimal list-outside" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="px-8 list-decimal list-outside" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      <Link
        className="underline hover:text-blue-400"
        target="_blank"
        rel="noreferrer"
        {...toAny(props)}
      >
        <b>
          <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </b>
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        <WordByWordFadeIn>{children}</WordByWordFadeIn>
      </h6>
    );
  },
  img: ({ node, children, ...props }) => {
    const { src, alt, ...rest } = props;

    // eslint-disable-next-line @next/next/no-img-element
    return <img className="mx-auto rounded-lg" src={src} alt={alt} {...rest} />;
  },
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <article className="w-full h-full relative">
      {isJson(children) ? (
        <JsonView data={children} />
      ) : (
        <ReactMarkdown components={components}>{children}</ReactMarkdown>
      )}
    </article>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
