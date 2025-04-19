"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export interface NewsArticle {
  href: string;
  title: string;
  summary: string;
  image?: string;
}

const OFFSET_FACTOR = 4;
const SCALE_FACTOR = 0.03;
const OPACITY_FACTOR = 0.1;

export function News({ articles }: { articles: NewsArticle[] }) {
  const [dismissedNews, setDismissedNews] = React.useState<string[]>([]);
  const cards = articles.filter(({ href }) => !dismissedNews.includes(href));
  const cardCount = cards.length;
  const [prevCardCount, setPrevCardCount] = React.useState(cardCount);
  
  // Effect to show toast when all cards are dismissed
  React.useEffect(() => {
    if (prevCardCount > 0 && cardCount === 0) {
      toast.success("You've viewed all IMI Project updates!", {
        duration: 3000,
      });
    }
    setPrevCardCount(cardCount);
  }, [cardCount, prevCardCount]);

  return cardCount > 0 ? (
    <div
      className="group overflow-hidden px-3 pb-3 pt-8"
      data-active={cardCount !== 0}
    >
      <div className="relative size-full">
        {cards.toReversed().map(({ href, title, summary, image }, idx) => (
          <div
            key={href}
            className={cn(
              "absolute left-0 top-0 size-full scale-[var(--scale)] transition-[opacity,transform] duration-200",
              cardCount - idx > 3
                ? [
                    "opacity-0 sm:group-hover:translate-y-[var(--y)] sm:group-hover:opacity-[var(--opacity)]",
                    "sm:group-has-[*[data-dragging=true]]:translate-y-[var(--y)] sm:group-has-[*[data-dragging=true]]:opacity-[var(--opacity)]",
                  ]
                : "translate-y-[var(--y)] opacity-[var(--opacity)]"
            )}
            style={
              {
                "--y": `-${(cardCount - (idx + 1)) * OFFSET_FACTOR}%`,
                "--scale": 1 - (cardCount - (idx + 1)) * SCALE_FACTOR,
                "--opacity":
                  cardCount - (idx + 1) >= 6
                    ? 0
                    : 1 - (cardCount - (idx + 1)) * OPACITY_FACTOR,
              } as React.CSSProperties
            }
            aria-hidden={idx !== cardCount - 1}
          >
            <NewsCard
              title={title}
              description={summary}
              image={image}
              href={href}
              hideContent={cardCount - idx > 2}
              active={idx === cardCount - 1}
              onDismiss={() =>
                setDismissedNews([href, ...dismissedNews.slice(0, 50)])
              }
            />
          </div>
        ))}
        <div className="pointer-events-none invisible" aria-hidden>
          <NewsCard title="Title" description="Description" />
        </div>
      </div>
    </div>
  ) : null;
}

function NewsCard({
  title,
  description,
  image,
  onDismiss,
  hideContent,
  href,
  active,
}: {
  title: string;
  description: string;
  image?: string;
  onDismiss?: () => void;
  hideContent?: boolean;
  href?: string;
  active?: boolean;
}) {
  const { isMobile } = useMediaQuery();

  return (
    <Card
      className={cn(
        "relative select-none gap-2 p-3 text-[0.8125rem]",
        "transition-shadow hover:shadow-md"
      )}
    >
      <div className={cn(hideContent && "invisible")}>
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 font-medium text-foreground">
            {title}
          </span>
          <p className="line-clamp-2 h-10 leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="relative mt-3 aspect-[16/9] w-full shrink-0 overflow-hidden rounded border bg-muted">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="10vw"
              className={cn(
                "rounded object-contain object-center p-2",
                image.endsWith('.svg') && "dark:invert filter-none",
                image.includes('imi logo') && "scale-[2.0] p-0"
              )}
              draggable={false}
            />
          )}
        </div>
        <div className="flex items-center justify-between pt-3 text-xs">
          <Link
            href={href || "#"}
            target="_blank"
            className="font-medium text-muted-foreground hover:text-foreground transition-colors duration-75"
          >
            Read more
          </Link>
          <button
            type="button"
            onClick={() => onDismiss && onDismiss()}
            className="text-muted-foreground hover:text-foreground transition-colors duration-75"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Card>
  );
}

// Inline useMediaQuery hook
function useMediaQuery() {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return { isMobile };
}
