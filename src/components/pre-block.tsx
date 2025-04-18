"use client";

import type { JSX } from "react";
import {
  bundledLanguages,
  codeToHast,
  type BundledLanguage,
} from "shiki/bundle/web";
import { Fragment, useLayoutEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { safe } from "ts-safe";
import { cn } from "lib/utils";
import { useTheme } from "next-themes";
import { Button } from "ui/button";
import { Clipboard, CheckIcon } from "lucide-react";
import JsonView from "ui/json-view";
import { useCopy } from "@/hooks/use-copy";

const PurePre = ({
  children,
  className,
  code,
  lang,
}: { children: any; className?: string; code: string; lang: string }) => {
  const { copied, copy } = useCopy();

  return (
    <pre className={cn("relative ", className)}>
      <div className="w-full flex z-20 py-2 px-4 items-center">
        <span className="text-sm text-muted-foreground">{lang}</span>
        <Button
          size="icon"
          variant={copied ? "secondary" : "ghost"}
          className="ml-auto z-10 p-3! size-2! rounded-sm"
          onClick={() => {
            copy(code);
          }}
        >
          {copied ? <CheckIcon /> : <Clipboard className="size-3!" />}
        </Button>
      </div>
      <div className="relative overflow-x-auto px-6 pb-6">{children}</div>
      <div className="absolute top-0 right-0 h-full w-1/5 bg-gradient-to-r from-transparent to-background  pointer-events-none" />
    </pre>
  );
};

export async function highlight(
  code: string,
  lang: BundledLanguage,
  theme: string,
) {
  const parsed: BundledLanguage = bundledLanguages[lang] ? lang : "md";

  if (lang === "json") {
    return (
      <PurePre code={code} lang={lang}>
        <JsonView data={code} initialExpandDepth={3} />
      </PurePre>
    );
  }

  const out = await codeToHast(code, {
    lang: parsed,
    theme,
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (props) => <PurePre {...props} code={code} lang={lang} />,
    },
  }) as JSX.Element;
}

export function PreBlock({ children }: { children: any }) {
  const code = children.props.children;
  const { theme } = useTheme();
  const language = children.props.className?.split("-")?.[1] || "bash";
  const [loading, setLoading] = useState(true);

  const [component, setComponent] = useState<JSX.Element | null>(
    <PurePre className="animate-pulse" code={code} lang={language}>
      {children}
    </PurePre>,
  );
  useLayoutEffect(() => {
    safe()
      .map(() =>
        highlight(
          code,
          language,
          theme == "dark" ? "dark-plus" : "github-light",
        ),
      )
      .ifOk(setComponent)
      .watch(setLoading.bind(null, false));
  }, [theme, language, code]);
  return (
    <div
      className={cn(
        loading && "animate-pulse",
        "flex flex-col border border-dashed rounded-lg relative mb-4 overflow-hidden",
      )}
    >
      {component}
    </div>
  );
}
