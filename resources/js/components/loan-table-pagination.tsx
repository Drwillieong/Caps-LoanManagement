import { Button } from '@/components/ui/button';

interface LoanTablePaginationProps {
    currentPage: number;
    rowsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
}

const ROW_OPTIONS = [5, 10, 25, 50];

export function LoanTablePagination({
    currentPage,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange,
}: LoanTablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const lastItem = Math.min(currentPage * rowsPerPage, totalItems);
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => {
        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
    });

    return (
        <div className="no-print mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span>
                    Showing {firstItem} to {lastItem} of {totalItems} entries
                </span>
                <label className="flex items-center gap-2">
                    <span>Rows</span>
                    <select
                        value={rowsPerPage}
                        onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
                        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none"
                    >
                        {ROW_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex flex-wrap items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Previous
                </Button>
                {pages.map((page, index) => {
                    const previousPage = pages[index - 1];
                    const showGap = previousPage && page - previousPage > 1;

                    return (
                        <div key={page} className="flex items-center gap-1">
                            {showGap && <span className="px-2 text-slate-400">...</span>}
                            <Button
                                type="button"
                                variant={page === currentPage ? 'default' : 'outline'}
                                size="sm"
                                className="min-w-9"
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </Button>
                        </div>
                    );
                })}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
