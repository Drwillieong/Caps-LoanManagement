import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Users, Phone, MapPin, Calendar, CreditCard, Banknote, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem } from '@/types';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface MemberProfile {
    id: number;
    user_id: number;
    employee_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    date_of_birth: string;
    sex: string;
    civil_status: string;
    spouse_name: string | null;
    mobile_number: string;
    present_address: string;
    permanent_address: string;
    position: string;
    date_hired: string;
    basic_salary: number;
    share_capital_balance: number;
    bank_account_number: string;
    tin_number: string;
}

interface Beneficiary {
    id: number;
    member_profile_id: number;
    full_name: string;
    relationship: string;
    date_of_birth: string;
}

interface Props {
    user: UserData;
    memberProfile: MemberProfile | null;
    beneficiaries: Beneficiary[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
    { title: 'User Profile', href: '/dashboards/HR/MembersProfile' },
];

export default function MembersProfile({ user, memberProfile, beneficiaries }: Props) {
    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);

    const exportPDF = () => {
        if (!memberProfile) return;

        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Member Profile Report', 14, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 28);

        // User Account Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('User Account Information', 14, 40);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const userInfo = [
            ['Email:', user.email],
            ['Role:', user.role],
            ['Status:', user.is_active ? 'Active' : 'Inactive'],
            ['Created At:', formatDate(user.created_at)],
        ];
        
        autoTable(doc, {
            startY: 45,
            head: [['Field', 'Value']],
            body: userInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        // Personal Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Personal Information', 14, (doc as any).lastAutoTable.finalY + 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const personalInfo = [
            ['Employee ID:', memberProfile.employee_id],
            ['First Name:', memberProfile.first_name],
            ['Middle Name:', memberProfile.middle_name || 'N/A'],
            ['Last Name:', memberProfile.last_name],
            ['Date of Birth:', formatDate(memberProfile.date_of_birth)],
            ['Sex:', memberProfile.sex],
            ['Civil Status:', memberProfile.civil_status],
            ['Spouse Name:', memberProfile.spouse_name || 'N/A'],
        ];
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Field', 'Value']],
            body: personalInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        // Contact Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Contact Information', 14, (doc as any).lastAutoTable.finalY + 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const contactInfo = [
            ['Mobile Number:', memberProfile.mobile_number],
            ['Present Address:', memberProfile.present_address],
            ['Permanent Address:', memberProfile.permanent_address],
        ];
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Field', 'Value']],
            body: contactInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        // Employment Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Employment Information', 14, (doc as any).lastAutoTable.finalY + 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const employmentInfo = [
            ['Position:', memberProfile.position],
            ['Date Hired:', formatDate(memberProfile.date_hired)],
            ['Basic Salary:', formatCurrency(memberProfile.basic_salary)],
        ];
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Field', 'Value']],
            body: employmentInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        // Financial Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Information', 14, (doc as any).lastAutoTable.finalY + 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const financialInfo = [
            ['Share Capital Balance:', formatCurrency(memberProfile.share_capital_balance)],
            ['Bank Account Number:', memberProfile.bank_account_number || 'N/A'],
            ['TIN Number:', memberProfile.tin_number || 'N/A'],
        ];
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Field', 'Value']],
            body: financialInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        // Beneficiaries
        if (beneficiaries && beneficiaries.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Beneficiaries', 14, (doc as any).lastAutoTable.finalY + 15);
            
            const beneficiaryData = beneficiaries.map(b => [
                b.full_name,
                b.relationship,
                formatDate(b.date_of_birth)
            ]);
            
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Full Name', 'Relationship', 'Date of Birth']],
                body: beneficiaryData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: 14, right: 14 },
            });
        }

        // Save the PDF
        const fileName = `${memberProfile.last_name}_${memberProfile.first_name}_Profile.pdf`;
        doc.save(fileName);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title={`${memberProfile?.first_name || user.name}'s Profile`} />

            <div className="space-y-8 px-6 py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboards/HR/SeeUsers">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {memberProfile ? `${memberProfile.first_name} ${memberProfile.last_name}` : user.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {memberProfile?.employee_id ? `Employee ID: ${memberProfile.employee_id}` : `Email: ${user.email}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            user.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                            {user.role}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => exportPDF()}>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="rounded-xl border bg-background">
                    <div className="flex items-center gap-2 border-b px-6 py-4">
                        <User className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Personal Information</h2>
                    </div>

                    {memberProfile ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-muted-foreground">Basic Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Full Name</span>
                                        <span className="text-sm font-medium">
                                            {memberProfile.first_name} {memberProfile.middle_name} {memberProfile.last_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Date of Birth</span>
                                        <span className="text-sm font-medium">{formatDate(memberProfile.date_of_birth)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Sex</span>
                                        <span className="text-sm font-medium capitalize">{memberProfile.sex}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Civil Status</span>
                                        <span className="text-sm font-medium capitalize">{memberProfile.civil_status}</span>
                                    </div>
                                    {memberProfile.spouse_name && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Spouse Name</span>
                                            <span className="text-sm font-medium">{memberProfile.spouse_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-muted-foreground">Contact Details</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{memberProfile.mobile_number}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm font-medium">{memberProfile.present_address}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm font-medium">{memberProfile.permanent_address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Info */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-muted-foreground">Employment Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Position</span>
                                        <span className="text-sm font-medium">{memberProfile.position}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Date Hired</span>
                                        <span className="text-sm font-medium">{formatDate(memberProfile.date_hired)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <Banknote className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{formatCurrency(memberProfile.basic_salary)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{formatCurrency(memberProfile.share_capital_balance)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Info */}
                            <div className="space-y-4 md:col-span-2 lg:col-span-3">
                                <h3 className="font-medium text-muted-foreground">Financial Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-lg border p-4">
                                        <span className="text-sm text-muted-foreground">Bank Account Number</span>
                                        <p className="text-lg font-semibold">{memberProfile.bank_account_number || 'N/A'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <span className="text-sm text-muted-foreground">TIN Number</span>
                                        <p className="text-lg font-semibold">{memberProfile.tin_number || 'N/A'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <span className="text-sm text-muted-foreground">Share Capital Balance</span>
                                        <p className="text-lg font-semibold">{formatCurrency(memberProfile.share_capital_balance)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-muted-foreground">
                            <p>No member profile found for this user.</p>
                        </div>
                    )}
                </div>

                {/* Beneficiaries */}
                <div className="rounded-xl border bg-background">
                    <div className="flex items-center gap-2 border-b px-6 py-4">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Beneficiaries</h2>
                    </div>

                    {beneficiaries && beneficiaries.length > 0 ? (
                        <div className="p-6">
                            <table className="min-w-full text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Full Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Relationship</th>
                                        <th className="px-4 py-3 text-left font-medium">Date of Birth</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {beneficiaries.map((beneficiary) => (
                                        <tr key={beneficiary.id} className="border-b">
                                            <td className="px-4 py-3 font-medium">{beneficiary.full_name}</td>
                                            <td className="px-4 py-3 capitalize">{beneficiary.relationship}</td>
                                            <td className="px-4 py-3">{formatDate(beneficiary.date_of_birth)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-muted-foreground">
                            <p>No beneficiaries found for this member.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
