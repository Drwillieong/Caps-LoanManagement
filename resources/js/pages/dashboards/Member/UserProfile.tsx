import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { 
    User, 
    MapPin, 
    Briefcase, 
    Heart, 
    Camera, 
    Building,
    Phone,
    Users,
    ArrowLeft,
    Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Profile',
        href: '/dashboards/Member/UserProfile',
    },
];

// ──────────────────────────────────────────────────
// Utility Helpers
// ──────────────────────────────────────────────────

function getTodayISO(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatCurrency(raw: string): string {
    const num = parseFloat(raw.replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function parseCurrency(formatted: string): string {
    return formatted.replace(/,/g, '');
}

function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 3) return digits;
    if (digits.startsWith('63')) {
        const rest = digits.slice(2);
        if (rest.length <= 3) return `+63 ${rest}`;
        if (rest.length <= 6) return `+63 ${rest.slice(0, 3)} ${rest.slice(3)}`;
        return `+63 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
    }
    if (digits.startsWith('0')) {
        const rest = digits.slice(1);
        if (rest.length <= 3) return digits;
        if (rest.length <= 6) return `+63 ${rest.slice(0, 3)} ${rest.slice(3)}`;
        return `+63 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
    }
    return digits;
}

const CURRENCY_FIELDS = [
    'basic_salary',
    'net_income',
    'share_capital_balance',
    'spouse_gross_income',
    'spouse_net_income',
];

const cleanNumericValue = (val: string | number) => {
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/,/g, '')) || 0;
};

function parsePhone(formatted: string): string {
    const digits = formatted.replace(/\D/g, '');
    if (digits.startsWith('63')) return digits;
    if (digits.startsWith('0')) return `63${digits.slice(1)}`;
    return digits;
}

interface Beneficiary {
    id?: number;
    full_name: string;
    relationship: string;
}

interface MemberProfile {
    user_id: number;
    employee_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    place_of_birth?: string | null;
    date_of_birth: string;
    sex: string;
    civil_status: string;
    educational_attainment?: string | null;
    mobile_number: string;
    permanent_mobile_number?: string | null;
    present_address: string;
    present_zip_code?: string | null;
    permanent_address?: string;
    permanent_zip_code?: string | null;
    position: string;
    basic_salary: number;
    income_type?: string | null;
    net_income?: number | null;
    share_capital_balance?: number;
    other_source_of_income?: string | null;
    facebook_account_name?: string | null;
    spouse_occupation?: string | null;
    spouse_gross_income?: number | null;
    spouse_income_type?: string | null;
    spouse_net_income?: number | null;
    real_properties_owned?: string | null;
    profile_picture?: string;
}

interface Props {
    memberProfile?: MemberProfile | null;
    beneficiaries: Beneficiary[];
    isNewUser: boolean;
    isAdmin?: boolean;
    profileCompleted: boolean;
    targetEmployeeId?: string;
    targetUserName?: string;
}

export default function UserProfile({ memberProfile, beneficiaries, isNewUser, isAdmin = false, profileCompleted, targetEmployeeId, targetUserName }: Props) {
    const isHREditingMember = isAdmin && targetEmployeeId;
    
    // For HR editing, always enable editing
const [isEditing, setIsEditing] = useState(isNewUser || isHREditingMember);
    
    const [previewUrl, setPreviewUrl] = useState('');
    
    useEffect(() => {
      if (memberProfile?.profile_picture) {
        setPreviewUrl(`/storage/profiles/${memberProfile.profile_picture}`);
      } else {
        setPreviewUrl('');
      }
    }, [memberProfile]);
    
    // ── Currency & Phone Handlers ──

    const handleCurrencyChange = useCallback((field: string, raw: string) => {
        const cleaned = raw.replace(/,/g, '');
        if (/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '') {
            setFormData((prev: any) => ({ ...prev, [field]: cleaned }));
        }
    }, []);

    const handleCurrencyFocus = useCallback((field: string) => {
        setFormData((prev: any) => {
            const val = prev[field];
            if (!val) return prev;
            return { ...prev, [field]: parseCurrency(val) };
        });
    }, []);

    const handleCurrencyBlur = useCallback((field: string) => {
        setFormData((prev: any) => {
            const val = prev[field];
            if (!val) return prev;
            return { ...prev, [field]: formatCurrency(val) };
        });
    }, []);

    const handlePhoneChange = useCallback((value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 12);
        setFormData((prev: any) => ({ ...prev, permanent_mobile_number: digits }));
    }, []);

    // Initialize form data from existing profile or defaults
    const [formData, setFormData] = useState<any>({
        employee_id: memberProfile?.employee_id || '',
        first_name: memberProfile?.first_name || '',
        middle_name: memberProfile?.middle_name || '',
        last_name: memberProfile?.last_name || '',
        place_of_birth: memberProfile?.place_of_birth || '',
        date_of_birth: memberProfile?.date_of_birth || '',
        sex: memberProfile?.sex || '',
        civil_status: memberProfile?.civil_status || '',
        educational_attainment: memberProfile?.educational_attainment || '',
        permanent_mobile_number: memberProfile?.permanent_mobile_number || memberProfile?.mobile_number || '',
        present_zip_code: memberProfile?.present_zip_code || '',
        present_address: memberProfile?.present_address || '',
        permanent_address: memberProfile?.permanent_address || '',
        permanent_zip_code: memberProfile?.permanent_zip_code || '',
        position: memberProfile?.position || '',
        basic_salary: memberProfile?.basic_salary ? formatCurrency(String(memberProfile.basic_salary)) : '',
        income_type: memberProfile?.income_type || 'monthly',
        net_income: memberProfile?.net_income ? formatCurrency(String(memberProfile.net_income)) : '',
        share_capital_balance: memberProfile?.share_capital_balance ? formatCurrency(String(memberProfile.share_capital_balance)) : '',
        other_source_of_income: memberProfile?.other_source_of_income || '',
        facebook_account_name: memberProfile?.facebook_account_name || '',
        spouse_occupation: memberProfile?.spouse_occupation || '',
        spouse_gross_income: memberProfile?.spouse_gross_income ? formatCurrency(String(memberProfile.spouse_gross_income)) : '',
        spouse_income_type: memberProfile?.spouse_income_type || 'monthly',
        spouse_net_income: memberProfile?.spouse_net_income ? formatCurrency(String(memberProfile.spouse_net_income)) : '',
        real_properties_owned: memberProfile?.real_properties_owned || '',
        profile_picture: memberProfile?.profile_picture || '',
        beneficiaries: beneficiaries.length > 0 ? beneficiaries : [{ full_name: '', relationship: '' }],
    });

    const addBeneficiary = () => {
        setFormData({
            ...formData,
            beneficiaries: [...formData.beneficiaries, { full_name: '', relationship: '' }],
        });
    };

    const removeBeneficiary = (index: number) => {
        const updatedBeneficiaries = formData.beneficiaries.filter((_: Beneficiary, i: number) => i !== index);
        setFormData({
            ...formData,
            beneficiaries: updatedBeneficiaries.length > 0 ? updatedBeneficiaries : [{ full_name: '', relationship: '' }],
        });
    };

    const updateBeneficiary = (index: number, field: keyof Beneficiary, value: string) => {
        const updatedBeneficiaries = [...formData.beneficiaries];
        updatedBeneficiaries[index] = { ...updatedBeneficiaries[index], [field]: value };
        setFormData({
            ...formData,
            beneficiaries: updatedBeneficiaries,
        });
    };

    // Fields that are required for new users
    const requiredFields = isNewUser ? [
        'employee_id', 'first_name', 'last_name', 'date_of_birth', 'sex', 
        'civil_status', 'mobile_number', 'present_address', 'position', 
        'basic_salary'
    ] : [];

    // Determine if user can edit employment - admins can always edit, members only when isEditing
    const canEditEmployment = isAdmin;

    const exportPDF = () => {
        if (!memberProfile) return;

        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Member Profile Report', 14, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 28);

        const fmtCurrency = (amount: number) => 
            '₱' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const userInfo: string[][] = [
            ['Employee ID:', memberProfile.employee_id],
            ['First Name:', memberProfile.first_name],
            ['Middle Name:', memberProfile.middle_name || 'N/A'],
            ['Last Name:', memberProfile.last_name],
            ['Date of Birth:', formatDate(memberProfile.date_of_birth)],
            ['Sex:', memberProfile.sex],
            ['Civil Status:', memberProfile.civil_status],
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

        const contactInfo: string[][] = [
            ['Contact Number:', memberProfile.permanent_mobile_number || memberProfile.mobile_number],
            ['Present Address:', memberProfile.present_address],
            ['Permanent Address:', memberProfile.permanent_address || 'N/A'],
        ];
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Field', 'Value']],
            body: contactInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        const employmentInfo: string[][] = [
            ['Position:', memberProfile.position],
            ['Income (Gross):', fmtCurrency(memberProfile.basic_salary)],
        ];
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Field', 'Value']],
            body: employmentInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        const financialInfo: string[][] = [
            ['Share Capital Balance:', fmtCurrency(memberProfile.share_capital_balance || 0)],
        ];
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Field', 'Value']],
            body: financialInfo,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 100 },
            tableWidth: 'wrap',
        });

        const beneficiariesArr = formData.beneficiaries as Beneficiary[];
        if (beneficiariesArr && beneficiariesArr.length > 0) {
            const validBens = beneficiariesArr.filter((b: Beneficiary) => b.full_name);
            if (validBens.length > 0) {
                const beneficiaryData = validBens.map((b: Beneficiary) => [
                    b.full_name,
                    b.relationship || 'N/A',
                ]);
                
                autoTable(doc, {
                    startY: (doc as any).lastAutoTable.finalY + 15,
                    head: [['Full Name', 'Relationship']],
                    body: beneficiaryData,
                    theme: 'striped',
                    headStyles: { fillColor: [59, 130, 246] },
                    margin: { left: 14, right: 14 },
                });
            }
        }

        const fileName = `${memberProfile.last_name}_${memberProfile.first_name}_Profile.pdf`;
        doc.save(fileName);
    };

    // Get the appropriate URL for form action
    const formActionUrl = isHREditingMember 
        ? `/dashboards/HR/EditMember/${targetEmployeeId}` 
        : '/dashboards/Member/UserProfile';

    const formMethod = isHREditingMember ? 'put' : 'post';

    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'N/A';
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    };



    const isRequired = (field: string) => requiredFields.includes(field);
    
    return (
    <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
        <Head title="User Profile" />

        <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboards/Member">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <HeadingSmall
                            title={targetUserName || `${memberProfile?.first_name || ''} ${memberProfile?.last_name || ''}`}
                            description={
                                isEditing
                                    ? 'Editing member profile details'
                                    : 'View member profile information'
                            }
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportPDF()}>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                    {!isNewUser && (
                        <>
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Warning Banner for Incomplete Profile */}
            {!profileCompleted && (
                <Card className="border-l-4 border-l-amber-500 bg-amber-50">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                <span className="text-sm font-bold text-amber-600">!</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-amber-800">Complete Your Profile First</h3>
                                <p className="mt-1 text-sm text-amber-700">
                                    Please complete your profile with all required information before you can apply for a loan or access other member services.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Form
                method={formMethod}
                action={formActionUrl}
                transform={() => formData as any}
                className="space-y-6"
            >
                {({ processing, recentlySuccessful, errors }) => (
                    <>
                        {/* Identity Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            Identity
                                        </CardTitle>
                                    
                                    </div>
                                </div>
                            </CardHeader>
    <CardContent>
                                {/* Profile Picture */}
                                <div className="mb-6 p-6 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
                                  <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-shrink-0">
                                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-200 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                                        {previewUrl ? (
                                          <img 
                                            src={previewUrl} 
                                            alt="Profile Picture" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-emerald-600 font-bold text-xl bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 backdrop-blur-sm">
                                            {formData.first_name?.charAt(0)?.toUpperCase()}
                                            {formData.last_name?.charAt(0)?.toUpperCase()}
                                          </div>
                                        )}
                                        {isEditing && (
                                          <label
                                            htmlFor="profile_picture"
                                            className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-600 p-3 rounded-full shadow-2xl border-4 border-white cursor-pointer transition-all duration-200"
                                          >
                                            <Camera className="h-6 w-6 text-white" />
                                          </label>
                                        )}
                                      </div>
                                    </div>
                                    {isEditing ? (
                                      <div className="flex flex-col items-center gap-2">
                                        <input
                                          id="profile_picture"
                                          name="profile_picture"
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              if (file.size > 2 * 1024 * 1024) {
                                                alert('Image size must be less than 2MB.');
                                                (e.target as HTMLInputElement).value = '';
                                                return;
                                              }
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                setPreviewUrl(reader.result as string);
                                              };
                                              reader.readAsDataURL(file);
                                              setFormData({
                                                ...formData,
                                                profile_picture: file as any,
                                              });
                                            }
                                          }}
                                        />
                                        <label htmlFor="profile_picture" className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition cursor-pointer shadow-md">
                                          Change Profile Picture
                                        </label>
                                        <p className="text-xs text-muted-foreground text-center mt-1">
                                          JPG, PNG, GIF • Max 2MB
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <p className="text-sm font-medium text-emerald-800">Profile Picture</p>
                                        <p className="text-xs text-muted-foreground">Click Edit to change</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_id">
                                            Member ID <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="employee_id"
                                            name="employee_id"
                                            value={formData.employee_id}
                                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                            required={isRequired('employee_id')}
                                            placeholder="e.g., EMP-001"
                                            disabled={!isEditing}
                                        />
                                    <InputError message={errors.employee_id} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">
                                            First Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            required={isRequired('first_name')}
                                            placeholder="First name"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.first_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="middle_name">Middle Name</Label>
                                        <Input
                                            id="middle_name"
                                            name="middle_name"
                                            value={formData.middle_name}
                                            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                            placeholder="Middle name"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.middle_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">
                                            Last Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            required={isRequired('last_name')}
                                            placeholder="Last name"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.last_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Date of Birth</Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formatDate(formData.date_of_birth)}
                                            </div>
                                        ) : (
                                            <Input
                                                type="date"
                                                name="date_of_birth"
                                                value={formData.date_of_birth}
                                                max={getTodayISO()}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, date_of_birth: e.target.value })
                                                }
                                            />
                                        )}
                                        <InputError message={errors.date_of_birth} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="sex">
                                            Sex <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="sex"
                                            name="sex"
                                            value={formData.sex}
                                            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                            required={isRequired('sex')}
                                            disabled={!isEditing}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select sex</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                        <InputError message={errors.sex} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="civil_status">
                                            Civil Status <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="civil_status"
                                            name="civil_status"
                                            value={formData.civil_status}
                                            onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
                                            required={isRequired('civil_status')}
                                            disabled={!isEditing}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select civil status</option>
                                            <option value="single">Single</option>
                                            <option value="married">Married</option>
                                            <option value="widowed">Widower/Widow</option>
                                        </select>
                                        <InputError message={errors.civil_status} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="place_of_birth">
                                            Place of Birth <span className="text-red-500">*</span>
                                        </Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formData.place_of_birth || 'Not provided'}
                                            </div>
                                        ) : (
                                            <Input
                                                id="place_of_birth"
                                                name="place_of_birth"
                                                value={formData.place_of_birth}
                                                onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                                                required
                                                placeholder="Enter place of birth"
                                                disabled={!isEditing}
                                            />
                                        )}
                                        <InputError message={errors.place_of_birth} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="educational_attainment">
                                            Educational Attainment <span className="text-red-500">*</span>
                                        </Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formData.educational_attainment || 'Not provided'}
                                            </div>
                                        ) : (
                                            <select
                                                id="educational_attainment"
                                                name="educational_attainment"
                                                value={formData.educational_attainment}
                                                onChange={(e) => setFormData({ ...formData, educational_attainment: e.target.value })}
                                                required
                                                disabled={!isEditing}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select educational attainment</option>
                                                <option value="Elementary">Elementary</option>
                                                <option value="High School">High School</option>
                                                <option value="Vocational">Vocational</option>
                                                <option value="College">College</option>
                                                <option value="Postgraduate">Postgraduate</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        )}
                                        <InputError message={errors.educational_attainment} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="facebook_account_name">Facebook Account (Name)</Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formData.facebook_account_name || 'Not provided'}
                                            </div>
                                        ) : (
                                            <Input
                                                id="facebook_account_name"
                                                name="facebook_account_name"
                                                value={formData.facebook_account_name}
                                                onChange={(e) => setFormData({ ...formData, facebook_account_name: e.target.value })}
                                                placeholder="Enter Facebook account name"
                                                disabled={!isEditing}
                                            />
                                        )}
                                        <InputError message={errors.facebook_account_name} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact & Address Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            Contact &amp; Address Details
                                        </CardTitle>
                                        <CardDescription>
                                            Primary contact number and residential addresses
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="grid gap-2 md:col-span-2 lg:col-span-1">
                                        <Label htmlFor="permanent_mobile_number">
                                            Contact Number <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground" />
                                            <Input
                                                id="permanent_mobile_number"
                                                name="permanent_mobile_number"
                                                type="tel"
                                                inputMode="numeric"
                                                value={formatPhone(formData.permanent_mobile_number)}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                placeholder="+63 912 345 6789"
                                                className="pl-9"
                                                disabled={!isEditing}
                                                aria-invalid={!!errors.permanent_mobile_number}
                                            />
                                        </div>
                                       
                                        <InputError message={errors.permanent_mobile_number} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="present_address">
                                            Present Address <span className="text-red-500">*</span>
                                        </Label>
                                        <textarea
                                            id="present_address"
                                            name="present_address"
                                            value={formData.present_address}
                                            onChange={(e) => setFormData({ ...formData, present_address: e.target.value })}
                                            required={isRequired('present_address')}
                                            disabled={!isEditing}
                                            placeholder="Present address"
                                            rows={1}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.present_address} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="present_zip_code">Present Address Zip Code</Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formData.present_zip_code || 'Not provided'}
                                            </div>
                                        ) : (
                                            <Input
                                                id="present_zip_code"
                                                name="present_zip_code"
                                                value={formData.present_zip_code}
                                                onChange={(e) => setFormData({ ...formData, present_zip_code: e.target.value })}
                                                placeholder="Enter zip code"
                                                disabled={!isEditing}
                                            />
                                        )}
                                        <InputError message={errors.present_zip_code} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="permanent_address">Permanent (Provincial) Address</Label>
                                        <textarea
                                            id="permanent_address"
                                            name="permanent_address"
                                            value={formData.permanent_address}
                                            onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                                            placeholder="Permanent address (optional)"
                                            rows={1}
                                            disabled={!isEditing}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.permanent_address} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="permanent_zip_code">Permanent Address Zip Code</Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formData.permanent_zip_code || 'Not provided'}
                                            </div>
                                        ) : (
                                            <Input
                                                id="permanent_zip_code"
                                                name="permanent_zip_code"
                                                value={formData.permanent_zip_code}
                                                onChange={(e) => setFormData({ ...formData, permanent_zip_code: e.target.value })}
                                                placeholder="Enter zip code"
                                                disabled={!isEditing}
                                            />
                                        )}
                                        <InputError message={errors.permanent_zip_code} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employment Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            Employment &amp; Financial Assessment
                                        </CardTitle>
                                        <CardDescription>
                                            Job details and income information for loan eligibility
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="position">
                                            Position <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="position"
                                            name="position"
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            required={isRequired('position')}
                                            placeholder="e.g., Software Engineer"
                                            disabled={!canEditEmployment}
                                        />
                                        <InputError message={errors.position} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="basic_salary">
                                            Income (Gross) <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                                ₱
                                            </span>
                                            <Input
                                                id="basic_salary"
                                                name="basic_salary"
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.basic_salary}
                                                placeholder="0.00"
                                                onChange={(e) => handleCurrencyChange('basic_salary', e.target.value)}
                                                onFocus={() => handleCurrencyFocus('basic_salary')}
                                                onBlur={() => handleCurrencyBlur('basic_salary')}
                                                className="pl-7"
                                                disabled={!canEditEmployment}
                                                aria-invalid={!!errors.basic_salary}
                                            />
                                        </div>
                                        <InputError message={errors.basic_salary} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="share_capital_balance">Share Capital Balance</Label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                                ₱
                                            </span>
                                            <Input
                                                id="share_capital_balance"
                                                name="share_capital_balance"
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.share_capital_balance}
                                                placeholder="0.00"
                                                onChange={(e) => handleCurrencyChange('share_capital_balance', e.target.value)}
                                                onFocus={() => handleCurrencyFocus('share_capital_balance')}
                                                onBlur={() => handleCurrencyBlur('share_capital_balance')}
                                                className="pl-7"
                                                disabled={!canEditEmployment}
                                                aria-invalid={!!errors.share_capital_balance}
                                            />
                                        </div>
                                        <InputError message={errors.share_capital_balance} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="income_type">
                                            Income Type <span className="text-red-500">*</span>
                                        </Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm capitalize">
                                                {formData.income_type || 'Not provided'}
                                            </div>
                                        ) : (
                                            <select
                                                id="income_type"
                                                name="income_type"
                                                value={formData.income_type}
                                                onChange={(e) => setFormData({ ...formData, income_type: e.target.value })}
                                                required
                                                disabled={!canEditEmployment}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="daily">Daily</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        )}
                                        <InputError message={errors.income_type} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="net_income">
                                            Net Income <span className="text-red-500">*</span>
                                        </Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formData.net_income ? `₱${formData.net_income}` : 'Not provided'}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                                    ₱
                                                </span>
                                                <Input
                                                    id="net_income"
                                                    name="net_income"
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.net_income}
                                                    placeholder="0.00"
                                                    onChange={(e) => handleCurrencyChange('net_income', e.target.value)}
                                                    onFocus={() => handleCurrencyFocus('net_income')}
                                                    onBlur={() => handleCurrencyBlur('net_income')}
                                                    className="pl-7"
                                                    disabled={!canEditEmployment}
                                                    aria-invalid={!!errors.net_income}
                                                />
                                            </div>
                                        )}
                                        <InputError message={errors.net_income} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="other_source_of_income">Other Source of Income (Specify)</Label>
                                        {!isEditing ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formData.other_source_of_income || 'Not provided'}
                                            </div>
                                        ) : (
                                            <Input
                                                id="other_source_of_income"
                                                name="other_source_of_income"
                                                value={formData.other_source_of_income}
                                                onChange={(e) => setFormData({ ...formData, other_source_of_income: e.target.value })}
                                                placeholder="Specify other income source"
                                                disabled={!canEditEmployment}
                                            />
                                        )}
                                        <InputError message={errors.other_source_of_income} />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground p-2">
                                    Note: If you want to add your share capital balance, you should go to the main office.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Spouse & Assets Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        <Heart className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            Spouse &amp; Beneficiaries
                                        </CardTitle>
                                        <CardDescription>
                                            Spouse financial profile and beneficiary designations (if applicable)
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        Spouse Information
                                    </h4>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_occupation">Occupation of Spouse</Label>
                                            {!isEditing ? (
                                                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                    {formData.spouse_occupation || 'Not provided'}
                                                </div>
                                            ) : (
                                                <Input
                                                    id="spouse_occupation"
                                                    name="spouse_occupation"
                                                    value={formData.spouse_occupation}
                                                    onChange={(e) => setFormData({ ...formData, spouse_occupation: e.target.value })}
                                                    placeholder="Enter spouse occupation"
                                                    disabled={!isEditing}
                                                />
                                            )}
                                            <InputError message={errors.spouse_occupation} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_gross_income">Spouse Income (Gross)</Label>
                                            {!isEditing ? (
                                                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                    {formData.spouse_gross_income ? `₱${formData.spouse_gross_income}` : 'Not provided'}
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">₱</span>
                                                    <Input
                                                        id="spouse_gross_income"
                                                        name="spouse_gross_income"
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.spouse_gross_income}
                                                        placeholder="0.00"
                                                        onChange={(e) => handleCurrencyChange('spouse_gross_income', e.target.value)}
                                                        onFocus={() => handleCurrencyFocus('spouse_gross_income')}
                                                        onBlur={() => handleCurrencyBlur('spouse_gross_income')}
                                                        className="pl-7"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            )}
                                            <InputError message={errors.spouse_gross_income} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_income_type">Spouse Income Type</Label>
                                            {!isEditing ? (
                                                <div className="rounded-md border bg-muted px-3 py-2 text-sm capitalize">
                                                    {formData.spouse_income_type || 'Not provided'}
                                                </div>
                                            ) : (
                                                <select
                                                    id="spouse_income_type"
                                                    name="spouse_income_type"
                                                    value={formData.spouse_income_type}
                                                    onChange={(e) => setFormData({ ...formData, spouse_income_type: e.target.value })}
                                                    disabled={!isEditing}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="monthly">Monthly</option>
                                                    <option value="daily">Daily</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            )}
                                            <InputError message={errors.spouse_income_type} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_net_income">Spouse Income (Net)</Label>
                                            {!isEditing ? (
                                                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                    {formData.spouse_net_income ? `₱${formData.spouse_net_income}` : 'Not provided'}
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">₱</span>
                                                    <Input
                                                        id="spouse_net_income"
                                                        name="spouse_net_income"
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.spouse_net_income}
                                                        placeholder="0.00"
                                                        onChange={(e) => handleCurrencyChange('spouse_net_income', e.target.value)}
                                                        onFocus={() => handleCurrencyFocus('spouse_net_income')}
                                                        onBlur={() => handleCurrencyBlur('spouse_net_income')}
                                                        className="pl-7"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            )}
                                            <InputError message={errors.spouse_net_income} />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Real Properties ── */}
                                <div className="mb-6">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <Building className="h-4 w-4" />
                                        Assets
                                    </h4>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="real_properties_owned">Real Properties Owned (Specify)</Label>
                                            {!isEditing ? (
                                                <div className="rounded-md border bg-muted px-3 py-2 text-sm min-h-20">
                                                    {formData.real_properties_owned || 'Not provided'}
                                                </div>
                                            ) : (
                                                <textarea
                                                    id="real_properties_owned"
                                                    name="real_properties_owned"
                                                    value={formData.real_properties_owned}
                                                    onChange={(e) => setFormData({ ...formData, real_properties_owned: e.target.value })}
                                                    placeholder="Specify real properties owned (e.g., Lot in Quezon City, House in Batangas)"
                                                    rows={3}
                                                    disabled={!isEditing}
                                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            )}
                                            <InputError message={errors.real_properties_owned} />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Beneficiaries ── */}
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            Beneficiaries
                                        </h4>
                                        {isEditing && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addBeneficiary}
                                            >
                                                Add Beneficiary
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                    {(formData.beneficiaries as Beneficiary[]).map((beneficiary: Beneficiary, index: number) => (
                                            <div
                                                key={index}
                                                className="rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-medium">
                                                        Beneficiary {index + 1}
                                                    </span>
                                                    {formData.beneficiaries.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeBeneficiary(index)}
                                                            className="text-destructive hover:text-destructive/80"
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`beneficiaries[${index}][full_name]`}>
                                                            Full Name
                                                        </Label>
                                                        <Input
                                                            id={`beneficiaries[${index}][full_name]`}
                                                            name={`beneficiaries[${index}][full_name]`}
                                                            value={beneficiary.full_name}
                                                            onChange={(e) => updateBeneficiary(index, 'full_name', e.target.value)}
                                                            placeholder="Full name"
                                                            disabled={!isEditing}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`beneficiaries[${index}][relationship]`}>
                                                            Relationship
                                                        </Label>
                                                        <Input
                                                            id={`beneficiaries[${index}][relationship]`}
                                                            name={`beneficiaries[${index}][relationship]`}
                                                            value={beneficiary.relationship}
                                                            onChange={(e) => updateBeneficiary(index, 'relationship', e.target.value)}
                                                            placeholder="e.g., Wife, Daughter"
                                                            disabled={!isEditing}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex items-center gap-4 pb-8">
                            {isEditing && (
                                <div className="flex items-center gap-4">
                                    <Button disabled={processing} type="submit">
                                        Save Changes
                                    </Button>

                                    <Transition show={recentlySuccessful}>
                                        <p className="text-sm text-green-600">
                                            Saved successfully!
                                        </p>
                                    </Transition>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Form>
        </div>
    </AppLayout>
    );
}
