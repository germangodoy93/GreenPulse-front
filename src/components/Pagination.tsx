interface PaginationProps {
  page: number;
  hasNext: boolean;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}

export default function Pagination({ page, hasNext, total, pageSize, onPage }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
      <span>
        Página {page} de {totalPages} ({total} total)
      </span>
      <div className="flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Anterior
        </button>
        <button
          disabled={!hasNext}
          onClick={() => onPage(page + 1)}
          className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
