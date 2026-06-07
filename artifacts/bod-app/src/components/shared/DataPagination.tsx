import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { useLang } from "@/contexts/LangContext";

interface Props {
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function DataPagination({ page, lastPage, onPageChange, className }: Props) {
  const { t, isRTL } = useLang();

  if (lastPage <= 1) return null;

  const pages = getPageNumbers(page, lastPage);

  const go = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (p < 1 || p > lastPage || p === page) return;
    onPageChange(p);
  };

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <Pagination className={cn("mt-4", className)}>
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          <PaginationLink
            href="#"
            size="default"
            onClick={go(page - 1)}
            aria-label="Go to previous page"
            className={cn("gap-1.5 px-3", page <= 1 && "pointer-events-none opacity-40")}
          >
            <PrevIcon className="h-4 w-4" />
            <span>{t.previous}</span>
          </PaginationLink>
        </PaginationItem>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={go(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {/* Next */}
        <PaginationItem>
          <PaginationLink
            href="#"
            size="default"
            onClick={go(page + 1)}
            aria-label="Go to next page"
            className={cn("gap-1.5 px-3", page >= lastPage && "pointer-events-none opacity-40")}
          >
            <span>{t.next}</span>
            <NextIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
