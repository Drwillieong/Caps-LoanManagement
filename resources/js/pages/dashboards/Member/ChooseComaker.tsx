import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { dashboard } from '@/routes';
import { applyLoan, chooseComaker } from '@/routes/member';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Search, User, CheckCircle2, Users, ArrowRight, Shield, Calendar, XCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Choose Comaker',
        href: chooseComaker().url,
    },
];

interface MemberData {
    id: number;
    name: string;
    email: string;
    member_id: string;
    status: 'available' | 'unavailable';
    share_capital: number;
    date_joined: string;
}

interface ChooseComakerProps {
    members: MemberData[];
}

export default function ChooseComaker() {
    const { props } = usePage<SharedData & ChooseComakerProps>();
    const members = props.members as MemberData[];
    
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof MemberData>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter members based on search query
    const filteredMembers = useMemo(() => {
        let result = members;
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (member) =>
                    member.name.toLowerCase().includes(query) ||
                    member.email.toLowerCase().includes(query) ||
                    member.member_id.toLowerCase().includes(query)
            );
        }
        
        // Sort members
        result = [...result].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
        
        return result;
    }, [members, searchQuery, sortField, sortDirection]);

    // Pagination calculations
    const totalItems = filteredMembers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentMembers = filteredMembers.slice(startIndex, endIndex);

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Handle sort
    const handleSort = (field: keyof MemberData) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Get selected member details
    const selectedMember = members.find(m => m.id === selectedMemberId);

    // Handle proceed to ApplyLoan
    const handleProceed = () => {
        if (selectedMemberId) {
            window.location.href = applyLoan({ query: { co_maker_id: selectedMemberId.toString() } }).url;
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 7;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    // Get sort icon
    const getSortIcon = (field: keyof MemberData) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' 
            ? <ChevronUp className="ml-1 h-3 w-3" />
            : <ChevronDown className="ml-1 h-3 w-3" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Choose Comaker" />
            
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Info Card */}
                <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-emerald-900 dark:text-emerald-100">Why do I need a comaker?</p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                                    A comaker provides additional guarantee for your loan. They must be an active member 
                                    of the cooperative with good standing. The comaker will receive a notification to confirm 
                                    their commitment to your loan application.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members Table Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4 border-b bg-muted/10">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                                    <Users className="h-5 w-5 text-primary" />
                                    Available Members
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Search and select a member to be your co-maker
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {totalItems} members
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* Search and Filter Section */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, email, or member ID..."
                                    className="pl-10 border-muted-foreground/20 focus-visible:ring-primary"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(value) => {
                                        setItemsPerPage(parseInt(value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[130px] border-muted-foreground/20">
                                        <SelectValue placeholder="Show per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 per page</SelectItem>
                                        <SelectItem value="10">10 per page</SelectItem>
                                        <SelectItem value="20">20 per page</SelectItem>
                                        <SelectItem value="50">50 per page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Table */}
                        {currentMembers.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30 text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider w-[60px]">Select</th>
                                            <th 
                                                className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                                onClick={() => handleSort('member_id')}
                                            >
                                                <div className="flex items-center">
                                                    Member ID
                                                    {getSortIcon('member_id')}
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center">
                                                    Name
                                                    {getSortIcon('name')}
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors hidden md:table-cell"
                                                onClick={() => handleSort('email')}
                                            >
                                                <div className="flex items-center">
                                                    Email
                                                    {getSortIcon('email')}
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors hidden lg:table-cell"
                                                onClick={() => handleSort('date_joined')}
                                            >
                                                <div className="flex items-center">
                                                    Date Joined
                                                    {getSortIcon('date_joined')}
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center">
                                                    Status
                                                    {getSortIcon('status')}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {currentMembers.map((member) => (
                                            <tr 
                                                key={member.id}
                                                onClick={() => member.status === 'available' && setSelectedMemberId(member.id)}
                                                className={`transition-all duration-200 cursor-pointer ${
                                                    selectedMemberId === member.id 
                                                        ? 'bg-primary/5 border-l-2 border-l-primary' 
                                                        : member.status === 'available'
                                                            ? 'hover:bg-muted/30'
                                                            : 'opacity-60 cursor-not-allowed'
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    {member.status === 'available' ? (
                                                        <div className="flex items-center justify-center">
                                                            {selectedMemberId === member.id ? (
                                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-muted-foreground/40" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs font-medium text-muted-foreground">
                                                    {member.member_id}
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {member.name}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                                    {member.email}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {formatDate(member.date_joined)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {member.status === 'available' ? (
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                                                            Available
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
                                                            Unavailable
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="rounded-full bg-muted/20 p-4 mb-4">
                                    <User className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                                <p className="text-base font-medium text-foreground">No members found</p>
                                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria</p>
                            </div>
                        )}

                        {/* Pagination Section */}
                        {totalItems > 0 && (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{' '}
                                    <span className="font-medium text-foreground">{endIndex}</span> of{' '}
                                    <span className="font-medium text-foreground">{totalItems}</span> members
                                </div>
                                
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious 
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(currentPage - 1);
                                                }}
                                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                        
                                        {getPageNumbers().map((page, index) => (
                                            <PaginationItem key={index}>
                                                {page === 'ellipsis' ? (
                                                    <PaginationEllipsis />
                                                ) : (
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handlePageChange(page as number);
                                                        }}
                                                        isActive={currentPage === page}
                                                        className={currentPage === page ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}
                                        
                                        <PaginationItem>
                                            <PaginationNext 
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(currentPage + 1);
                                                }}
                                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Selected Member Summary & Action */}
                {selectedMember && (
                    <Card className="border-l-4 border-l-primary shadow-md bg-gradient-to-r from-primary/5 to-background">
                        <CardContent className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-wider text-primary">Selected Comaker</p>
                                    <p className="truncate text-lg font-bold text-foreground">
                                        {selectedMember.name}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {selectedMember.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedMemberId(null)}
                                    className="w-full sm:w-auto border-muted-foreground/20 hover:bg-muted"
                                >
                                    Clear Selection
                                </Button>
                                <Button
                                    onClick={handleProceed}
                                    className="w-full sm:w-auto lg:min-w-[200px]"
                                    size="lg"
                                >
                                    Proceed to Apply Loan
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Selection State */}
                {!selectedMemberId && totalItems > 0 && (
                    <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 px-4 py-8">
                        <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted/20">
                                <User className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <p className="mt-3 text-sm font-medium text-muted-foreground">
                                Please select a member to continue
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Click on any available member row to select them
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}