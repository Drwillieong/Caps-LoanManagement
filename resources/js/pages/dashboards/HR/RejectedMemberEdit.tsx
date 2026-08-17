import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    User,
    MapPin,
    Briefcase,
    Heart,
    Users,
    Phone,
    Building,
    UserCircle,
    AlertTriangle,
    Send,
} from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
    { title: 'Edit & Resubmit', href: '' },
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

function formatCurrency(raw: string | number): string {
    const num = parseFloat(String(raw).replace(/,/g, ''));
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

function parsePhone(formatted: string): string {
    const digits = formatted.replace(/\D/g, '');
    if (digits.startsWith('63')) return digits;
    if (digits.startsWith('0')) return `63${digits.slice(1)}`;
    return digits;
}

function titleCase(value: string): string {
    return value
        .toLowerCase()
        .split(' ')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
}

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

interface MemberProfileData {
    members_id: string | null;
    payroll_id: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    place_of_birth: string | null;
    date_of_birth: string | null;
    sex: string | null;
    civil_status: string | null;
    educational_attainment: string | null;
    position: string | null;
    basic_salary: number | null;
    income_type: string | null;
    net_income: number | null;
    share_capital_balance: number | null;
    other_source_of_income: string | null;
    facebook_account_name: string | null;
    mobile_number: string | null;
    permanent_mobile_number: string | null;
    present_address: string | null;
    present_zip_code: string | null;
    permanent_address: string | null;
    permanent_zip_code: string | null;
    spouse_occupation: string | null;
    spouse_gross_income: number | null;
    spouse_income_type: string | null;
    spouse_net_income: number | null;
    legal_beneficiary_1_name: string | null;
    real_properties_owned: string | null;
}

interface Member {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    status: string;
    rejection_reason: string | null;
    member_profile: MemberProfileData | null;
}

interface Props {
    member: Member;
}

interface FieldOpts {
    required?: boolean;
    placeholder?: string;
    type?: string;
    max?: string;
    inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    helperText?: string;
    className?: string;
}

interface OptsBasic {
    required?: boolean;
    helperText?: string;
}

const SELECT_CLASS =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// ──────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────

export default function RejectedMemberEdit({ member }: Props) {
    const profile = member.member_profile;

    const { put, processing, errors, setError, clearErrors, transform } = useForm({});

    const [formData, setFormData] = useState({
        // ── Identity ──
        first_name: member.first_name || profile?.first_name || '',
        middle_name: member.middle_name || profile?.middle_name || '',
        last_name: member.last_name || profile?.last_name || '',
        email: member.email || '',
        role: 'member',

        // ── Personal ──
        place_of_birth: profile?.place_of_birth || '',
        date_of_birth: profile?.date_of_birth || '',
        civil_status: profile?.civil_status || '',
        sex: profile?.sex || '',
        educational_attainment: profile?.educational_attainment || '',

        // ── Contact & Address ──
        permanent_mobile_number:
            profile?.permanent_mobile_number || profile?.mobile_number || '',
        present_address: profile?.present_address || '',
        present_zip_code: profile?.present_zip_code || '',
        permanent_address: profile?.permanent_address || '',
        permanent_zip_code: profile?.permanent_zip_code || '',

        // ── Employment & Financial ──
        position: profile?.position || '',
        basic_salary: profile?.basic_salary ? formatCurrency(String(profile.basic_salary)) : '',
        income_type: profile?.income_type || 'monthly',
        net_income: profile?.net_income ? formatCurrency(String(profile.net_income)) : '',
        share_capital_balance: profile?.share_capital_balance
            ? formatCurrency(String(profile.share_capital_balance))
            : '',
        other_source_of_income: profile?.other_source_of_income || '',
        facebook_account_name: profile?.facebook_account_name || '',

        // ── Spouse ──
        spouse_occupation: profile?.spouse_occupation || '',
        spouse_gross_income: profile?.spouse_gross_income
            ? formatCurrency(String(profile.spouse_gross_income))
            : '',
        spouse_income_type: profile?.spouse_income_type || 'monthly',
        spouse_net_income: profile?.spouse_net_income
            ? formatCurrency(String(profile.spouse_net_income))
            : '',

        // ── Assets ──
        real_properties_owned: profile?.real_properties_owned || '',

        // ── Beneficiaries ──
        legal_beneficiary_1_name: profile?.legal_beneficiary_1_name || '',
    });

    const handleChange = useCallback((field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handlePhoneChange = useCallback((value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 12);
        setFormData((prev) => ({ ...prev, permanent_mobile_number: digits }));
    }, []);

    const handleCurrencyChange = useCallback((field: string, raw: string) => {
        const cleaned = raw.replace(/,/g, '');
        if (/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '') {
            setFormData((prev) => ({ ...prev, [field]: cleaned }));
        }
    }, []);

    const handleCurrencyBlur = useCallback((field: string) => {
        setFormData((prev) => {
            const val = prev[field as keyof typeof prev] as string;
            if (!val) return prev;
            return { ...prev, [field]: formatCurrency(val) };
        });
    }, []);

    const handleCurrencyFocus = useCallback((field: string) => {
        setFormData((prev) => {
            const val = prev[field as keyof typeof prev] as string;
            if (!val) return prev;
            return { ...prev, [field]: parseCurrency(val) };
        });
    }, []);

    // ── Field renderers ──

    const renderInput = (
        field: string,
        label: string,
        err: Record<string, string>,
        opts: FieldOpts = {},
    ) => {
        const value = formData[field as keyof typeof formData] as string;
        return (
            <div className="grid gap-1.5">
                <Label htmlFor={`resubmit-${field}`}>
                    {label}
                    {opts.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <Input
                    id={`resubmit-${field}`}
                    name={field}
                    type={opts.type || 'text'}
                    value={value}
                    inputMode={opts.inputMode}
                    max={opts.max}
                    placeholder={opts.placeholder}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={cn(
                        opts.className,
                        err[field] && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                    )}
                    aria-invalid={!!err[field]}
                />
                {opts.helperText && (
                    <p className="text-xs text-muted-foreground">{opts.helperText}</p>
                )}
                {err[field] && <InputError message={err[field]} />}
            </div>
        );
    };

    const renderCurrency = (
        field: string,
        label: string,
        err: Record<string, string>,
        opts: OptsBasic = {},
    ) => {
        const value = formData[field as keyof typeof formData] as string;
        return (
            <div className="grid gap-1.5">
                <Label htmlFor={`resubmit-${field}`}>
                    {label}
                    {opts.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                        ₱
                    </span>
                    <Input
                        id={`resubmit-${field}`}
                        name={field}
                        type="text"
                        inputMode="decimal"
                        value={value}
                        placeholder="0.00"
                        onChange={(e) => handleCurrencyChange(field, e.target.value)}
                        onFocus={() => handleCurrencyFocus(field)}
                        onBlur={() => handleCurrencyBlur(field)}
                        className={cn(
                            'pl-7',
                            err[field] && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                        )}
                        aria-invalid={!!err[field]}
                    />
                </div>
                {opts.helperText && (
                    <p className="text-xs text-muted-foreground">{opts.helperText}</p>
                )}
                {err[field] && <InputError message={err[field]} />}
            </div>
        );
    };

    const renderSelect = (
        field: string,
        label: string,
        options: { value: string; label: string }[],
        err: Record<string, string>,
        opts: OptsBasic & { placeholder?: string } = {},
    ) => {
        const value = formData[field as keyof typeof formData] as string;
        return (
            <div className="grid gap-1.5">
                <Label htmlFor={`resubmit-${field}`}>
                    {label}
                    {opts.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <select
                    id={`resubmit-${field}`}
                    name={field}
                    value={value}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={cn(
                        SELECT_CLASS,
                        err[field] && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                    )}
                    aria-invalid={!!err[field]}
                >
                    <option value="">{opts.placeholder || `Select ${label.toLowerCase()}`}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {err[field] && <InputError message={err[field]} />}
            </div>
        );
    };

    const renderTextarea = (
        field: string,
        label: string,
        err: Record<string, string>,
        opts: OptsBasic & { placeholder?: string } = {},
    ) => {
        const value = formData[field as keyof typeof formData] as string;
        return (
            <div className="grid gap-1.5">
                <Label htmlFor={`resubmit-${field}`}>
                    {label}
                    {opts.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <textarea
                    id={`resubmit-${field}`}
                    name={field}
                    value={value}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={opts.placeholder}
                    rows={3}
                    className={cn(
                        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        err[field] && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                    )}
                    aria-invalid={!!err[field]}
                />
                {err[field] && <InputError message={err[field]} />}
            </div>
        );
    };

    const todayISO = getTodayISO();
    const hasSpouseOccupation = formData.spouse_occupation.trim().length > 0;

    const getSpouseConditionalErrors = (): Record<string, string> => {
        if (!hasSpouseOccupation) return {};
        const errors: Record<string, string> = {};
        if (!formData.spouse_gross_income || parseFloat(formData.spouse_gross_income.replace(/,/g, '')) <= 0) {
            errors.spouse_gross_income = 'Spouse Income (Gross) is required when spouse occupation is provided.';
        }
        if (!formData.spouse_income_type) {
            errors.spouse_income_type = 'Spouse Income Type is required when spouse occupation is provided.';
        }
        if (!formData.spouse_net_income || parseFloat(formData.spouse_net_income.replace(/,/g, '')) <= 0) {
            errors.spouse_net_income = 'Spouse Net Income is required when spouse occupation is provided.';
        }
        return errors;
    };

    const buildPayload = () => {
        const parseNum = (val: string) => {
            const num = parseFloat(val.replace(/,/g, ''));
            return isNaN(num) ? 0 : num;
        };
        const parseNullableNum = (val: string) => {
            const cleaned = val.replace(/,/g, '');
            return cleaned ? parseFloat(cleaned) : null;
        };

        const cleanedPhone = parsePhone(formData.permanent_mobile_number);
        const tc = (v: string) => titleCase(v.trim());

        return {
            first_name: tc(formData.first_name),
            middle_name: formData.middle_name ? tc(formData.middle_name) : null,
            last_name: tc(formData.last_name),
            email: formData.email.trim().toLowerCase(),
            role: 'member',
            place_of_birth: tc(formData.place_of_birth),
            date_of_birth: formData.date_of_birth,
            civil_status: formData.civil_status,
            sex: formData.sex,
            educational_attainment: formData.educational_attainment,
            mobile_number: cleanedPhone,
            permanent_mobile_number: cleanedPhone,
            present_address: formData.present_address.trim(),
            present_zip_code: formData.present_zip_code.trim(),
            permanent_address: formData.permanent_address.trim(),
            permanent_zip_code: formData.permanent_zip_code.trim(),
            position: formData.position.trim(),
            basic_salary: parseNum(formData.basic_salary),
            income_type: formData.income_type,
            net_income: parseNum(formData.net_income),
            share_capital_balance: parseNum(formData.share_capital_balance),
            other_source_of_income: formData.other_source_of_income.trim() || null,
            facebook_account_name: formData.facebook_account_name.trim() || null,
            spouse_occupation: formData.spouse_occupation.trim() || null,
            spouse_gross_income: parseNullableNum(formData.spouse_gross_income),
            spouse_income_type: formData.spouse_income_type,
            spouse_net_income: parseNullableNum(formData.spouse_net_income),
            real_properties_owned: formData.real_properties_owned.trim() || null,
            legal_beneficiary_1_name: formData.legal_beneficiary_1_name.trim()
                ? tc(formData.legal_beneficiary_1_name)
                : null,
        };
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        clearErrors();

        const spouseConditionalErrors = getSpouseConditionalErrors();
        if (Object.keys(spouseConditionalErrors).length > 0) {
            setError(spouseConditionalErrors);
            toast.error('Please complete the highlighted spouse fields.');
            return;
        }

        transform(() => buildPayload());
        put(`/dashboards/HR/RejectedMembers/${member.id}`, {
            onSuccess: () => {
                toast.success('Member details updated and resubmitted for GM validation.');
            },
            onError: () => {
                toast.error('Failed to resubmit member. Please check the form for errors.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Edit & Resubmit Member" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboards/HR/SeeUsers">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <HeadingSmall
                                title={`Edit & Resubmit: ${member.first_name} ${member.last_name}`}
                                description="Fix the details below and resubmit. The account status will change back to Pending for GM review."
                            />
                        </div>
                    </div>
                </div>

                {/* Rejection Reason Banner */}
                {member.rejection_reason && (
                    <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/10">
                        <CardContent className="flex items-start gap-3 py-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                    This account was rejected by the General Manager
                                </p>
                                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                                    <strong>Reason:</strong> {member.rejection_reason}
                                </p>
                                <p className="mt-1 text-xs text-red-500">
                                    Please correct the issues above before resubmitting. Resubmitting will send the account back to the GM as Pending.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {(() => {
                        const err = errors as Record<string, string>;

                        return (
                            <>
                                {/* ═══════ SECTION 1 — Personal ═══════ */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Personal Information</CardTitle>
                                                <CardDescription>Full name, contact email, birth details, and civil status</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-5">
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {renderInput('first_name', 'First Name', err, {
                                                required: true,
                                                placeholder: 'Juan',
                                            })}
                                            {renderInput('middle_name', 'Middle Name', err, {
                                                placeholder: 'Dela Cruz',
                                            })}
                                            {renderInput('last_name', 'Last Name', err, {
                                                required: true,
                                                placeholder: 'Santos',
                                            })}

                                            <div className="grid gap-1.5">
                                                <Label htmlFor="resubmit-email">
                                                    Email Address <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="resubmit-email"
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    placeholder="e.g., member@company.com"
                                                    className={cn(
                                                        err.email && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                                                    )}
                                                    aria-invalid={!!err.email}
                                                />
                                                <InputError message={err.email} />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label htmlFor="resubmit-date_of_birth">
                                                    Date of Birth <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="resubmit-date_of_birth"
                                                    name="date_of_birth"
                                                    type="date"
                                                    value={formData.date_of_birth}
                                                    max={todayISO}
                                                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                                                    className={cn(
                                                        err.date_of_birth && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                                                    )}
                                                    aria-invalid={!!err.date_of_birth}
                                                />
                                                <InputError message={err.date_of_birth} />
                                            </div>

                                            {renderSelect(
                                                'sex',
                                                'Sex',
                                                [
                                                    { value: 'male', label: 'Male' },
                                                    { value: 'female', label: 'Female' },
                                                ],
                                                err,
                                                { required: true },
                                            )}

                                            {renderSelect(
                                                'civil_status',
                                                'Civil Status',
                                                [
                                                    { value: 'single', label: 'Single' },
                                                    { value: 'married', label: 'Married' },
                                                    { value: 'widowed', label: 'Widower / Widow' },
                                                ],
                                                err,
                                                { required: true },
                                            )}

                                            {renderInput('place_of_birth', 'Place of Birth', err, {
                                                required: true,
                                                placeholder: 'City, Province',
                                            })}

                                            {renderSelect(
                                                'educational_attainment',
                                                'Educational Attainment',
                                                [
                                                    { value: 'Elementary', label: 'Elementary' },
                                                    { value: 'High School', label: 'High School' },
                                                    { value: 'Vocational', label: 'Vocational' },
                                                    { value: 'College', label: 'College' },
                                                    { value: 'Postgraduate', label: 'Postgraduate' },
                                                    { value: 'Other', label: 'Other' },
                                                ],
                                                err,
                                                { required: true },
                                            )}

                                            {renderInput('facebook_account_name', 'Facebook Account', err, {
                                                required: true,
                                                placeholder: 'Profile name',
                                                helperText: 'For reference and verification',
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ═══════ SECTION 2 — Contact & Address ═══════ */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                <MapPin className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Contact &amp; Address Details</CardTitle>
                                                <CardDescription>Primary contact number and residential addresses</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-5">
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="grid gap-1.5 md:col-span-2 lg:col-span-1">
                                                <Label htmlFor="resubmit-permanent_mobile_number">
                                                    Contact Number <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <Phone className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground" />
                                                    <Input
                                                        id="resubmit-permanent_mobile_number"
                                                        name="permanent_mobile_number"
                                                        type="tel"
                                                        inputMode="numeric"
                                                        value={formatPhone(formData.permanent_mobile_number)}
                                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                                        placeholder="+63 912 345 6789"
                                                        className={cn(
                                                            'pl-9',
                                                            err.permanent_mobile_number && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                                                        )}
                                                        aria-invalid={!!err.permanent_mobile_number}
                                                    />
                                                </div>
                                                <InputError message={err.permanent_mobile_number} />
                                            </div>

                                            {renderTextarea('present_address', 'Present Address', err, {
                                                required: true,
                                                placeholder: 'House/Unit No., Street, Barangay, City',
                                            })}

                                            {renderInput('present_zip_code', 'Present Zip Code', err, {
                                                required: true,
                                                placeholder: 'e.g., 1000',
                                            })}

                                            {renderTextarea('permanent_address', 'Permanent / Provincial Address', err, {
                                                required: true,
                                                placeholder: 'House/Unit No., Street, Barangay, City, Province',
                                            })}

                                            {renderInput('permanent_zip_code', 'Permanent Zip Code', err, {
                                                required: true,
                                                placeholder: 'e.g., 1000',
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ═══════ SECTION 3 — Employment & Financial ═══════ */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                <Briefcase className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Employment &amp; Financial Assessment</CardTitle>
                                                <CardDescription>Job details and income information for loan eligibility</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-5">
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {renderInput('position', 'Position', err, {
                                                required: true,
                                                placeholder: 'e.g., Software Engineer',
                                            })}

                                            {renderCurrency('basic_salary', 'Income (Gross)', err, {
                                                required: true,
                                                helperText: 'Minimum ₱10,000.00',
                                            })}

                                            {renderCurrency('net_income', 'Net Income', err, {
                                                required: true,
                                                helperText: 'Minimum ₱10,000.00',
                                            })}

                                            {renderSelect(
                                                'income_type',
                                                'Income Type',
                                                [
                                                    { value: 'monthly', label: 'Monthly' },
                                                    { value: 'daily', label: 'Daily' },
                                                    { value: 'yearly', label: 'Yearly' },
                                                ],
                                                err,
                                                { required: true },
                                            )}

                                            {renderCurrency('share_capital_balance', 'Share Capital Balance', err, {
                                                required: true,
                                                helperText: 'Minimum ₱10,000.00',
                                            })}

                                            {renderInput('other_source_of_income', 'Other Source of Income', err, {
                                                placeholder: 'e.g., Freelance, Business',
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ═══════ SECTION 4 — Spouse & Assets ═══════ */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                <Heart className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Spouse &amp; Assets</CardTitle>
                                                <CardDescription>Spouse financial profile and real properties</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-5">
                                        <div className="mb-6">
                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                                <UserCircle className="h-4 w-4" />
                                                Spouse Information
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {renderInput('spouse_occupation', 'Occupation of Spouse', err, {
                                                    placeholder: 'Enter spouse occupation',
                                                    helperText: 'Optional',
                                                })}

                                                {renderCurrency('spouse_gross_income', 'Spouse Income (Gross)', err, {
                                                    required: hasSpouseOccupation,
                                                    helperText: hasSpouseOccupation ? 'Required' : 'Optional',
                                                })}

                                                {renderSelect(
                                                    'spouse_income_type',
                                                    'Spouse Income Type',
                                                    [
                                                        { value: 'monthly', label: 'Monthly' },
                                                        { value: 'daily', label: 'Daily' },
                                                        { value: 'yearly', label: 'Yearly' },
                                                    ],
                                                    err,
                                                    { required: hasSpouseOccupation, helperText: hasSpouseOccupation ? 'Required' : 'Optional' },
                                                )}

                                                {renderCurrency('spouse_net_income', 'Spouse Income (Net)', err, {
                                                    required: hasSpouseOccupation,
                                                    helperText: hasSpouseOccupation ? 'Required' : 'Optional',
                                                })}
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                                <Building className="h-4 w-4" />
                                                Assets
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-1">
                                                {renderTextarea('real_properties_owned', 'Real Properties Owned', err, {
                                                    placeholder: 'Specify real properties owned (e.g., Lot in Quezon City, House in Batangas)',
                                                    helperText: 'Optional — list properties if any',
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                Beneficiary
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-1">
                                                {renderInput('legal_beneficiary_1_name', 'Legal Beneficiary', err, {
                                                    placeholder: 'Full name of legal beneficiary',
                                                    helperText: 'Optional',
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ═══════ Submit ═══════ */}
                                <div className="flex items-center gap-4 pb-8">
                                    <Button disabled={processing} type="submit" size="lg">
                                        {processing ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Resubmitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Resubmit for GM Validation
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/dashboards/HR/SeeUsers">Cancel</Link>
                                    </Button>
                                </div>
                            </>
                        );
                    })()}
                </form>
            </div>
        </AppLayout>
    );
}
