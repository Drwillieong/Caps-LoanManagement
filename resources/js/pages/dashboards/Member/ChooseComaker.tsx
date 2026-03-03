import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import { applyLoan, chooseComaker } from '@/routes/member';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Search, User, CheckCircle2, Users, ArrowRight, Shield, Calendar, XCircle } from 'lucide-react';

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

    // Filter members based on search query
    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members;
        
        const query = searchQuery.toLowerCase();
        return members.filter(
            (member) =>
                member.name.toLowerCase().includes(query) ||
                member.email.toLowerCase().includes(query) ||
                member.member_id.toLowerCase().includes(query)
        );
    }, [members, searchQuery]);

    // Get selected member details
    const selectedMember = members.find(m => m.id === selectedMemberId);

    // Handle proceed to ApplyLoan
    const handleProceed = () => {
        if (selectedMemberId) {
            // Navigate to ApplyLoan with selected co-maker ID as query parameter
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

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Choose Comaker" />
            
            <div className="flex flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <HeadingSmall
                        title="Choose a Comaker"
                        description="Select a member to be your co-maker for the loan application"
                    />
                </div>

                {/* Info Card */}
                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-blue-900">Why do I need a comaker?</p>
                                <p className="text-sm text-blue-700">
                                    A comaker provides additional guarantee for your loan. They must be an active member 
                                    of the cooperative with good standing. The comaker will receive a notification to confirm 
                                    their commitment to your loan application.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members Table Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Available Members
                        </CardTitle>
                        <CardDescription>
                            Search and select a member to be your co-maker
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or member ID..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Results Count */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Showing {filteredMembers.length} of {members.length} members
                            </p>
                        </div>

                        {/* Table */}
                        {filteredMembers.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Select</th>
                                            <th className="px-4 py-3 text-left font-medium">Member ID</th>
                                            <th className="px-4 py-3 text-left font-medium">Name</th>
                                            <th className="px-4 py-3 text-left font-medium">Email</th>
                                            <th className="px-4 py-3 text-left font-medium">Date Joined</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredMembers.map((member) => (
                                            <tr 
                                                key={member.id}
                                                onClick={() => member.status === 'available' && setSelectedMemberId(member.id)}
                                                className={`transition-colors cursor-pointer ${
                                                    selectedMemberId === member.id 
                                                        ? 'bg-primary/10' 
                                                        : member.status === 'available'
                                                            ? 'hover:bg-muted/50'
                                                            : 'opacity-60 cursor-not-allowed'
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    {member.status === 'available' ? (
                                                        <div className="flex items-center justify-center">
                                                            {selectedMemberId === member.id ? (
                                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                                            ) : (
                                                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium">{member.member_id}</td>
                                                <td className="px-4 py-3">{member.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(member.date_joined)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {member.status === 'available' ? (
                                                        <Badge className="bg-green-500 hover:bg-green-600">
                                                            Available
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
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
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <User className="h-12 w-12 text-gray-300" />
                                <p className="mt-2 text-gray-500">No members found</p>
                                <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Selected Member Summary & Action */}
                {selectedMember && (
                    <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white shadow-md">
                        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 border-2 border-green-500">
                                    <User className="h-7 w-7 text-green-700" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-900">Selected Comaker</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedMember.name}</p>
                                    <p className="text-sm text-gray-500">{selectedMember.email}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedMemberId(null)}
                                    className="w-full"
                                >
                                    Clear Selection
                                </Button>
                                <Button
                                    onClick={handleProceed}
                                    className="w-full min-w-[200px]"
                                    size="lg"
                                >
                                    Proceed to Apply Loan
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Selection State */}
                {!selectedMemberId && (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8">
                        <div className="text-center">
                            <User className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                                Please select a member to continue
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
