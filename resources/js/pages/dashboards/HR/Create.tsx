import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { store } from '@/routes/users';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
    { title: 'Create', href: '/dashboards/HR/create' },
];

const MIN_FINANCIAL_AMOUNT = 10000;

const inputClass =
    'h-10 rounded-lg border-emerald-100 focus:ring-emerald-500/40';
const selectClass =
    'h-10 rounded-lg border-emerald-100 focus:ring-emerald-500/40';
const sectionClass =
    'rounded-xl border border-emerald-100 bg-white/50 p-6 dark:bg-emerald-950/10';

const requiredText = (label: string, max = 255) =>
    z
        .string()
        .trim()
        .min(1, `${label} is required.`)
        .max(max, `${label} must not exceed ${max} characters.`);

const optionalText = (label: string, max = 255) =>
    z.string().trim().max(max, `${label} must not exceed ${max} characters.`);

const requiredAmount = (label: string, minimum = 0) =>
    z
        .string()
        .trim()
        .min(1, `${label} is required.`)
        .refine(
            (value) => Number.isFinite(Number(value)),
            `${label} must be a valid amount.`,
        )
        .refine(
            (value) => Number(value) >= minimum,
            `${label} must be at least ${minimum.toLocaleString()}.`,
        );

const optionalAmount = (label: string) =>
    z
        .string()
        .trim()
        .refine(
            (value) => value === '' || Number.isFinite(Number(value)),
            `${label} must be a valid amount.`,
        )
        .refine(
            (value) => value === '' || Number(value) >= 0,
            `${label} must not be negative.`,
        );

const requiredPastDate = (label: string) =>
    z
        .string()
        .trim()
        .min(1, `${label} is required.`)
        .refine((value) => {
            const date = new Date(`${value}T00:00:00`);
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            return !Number.isNaN(date.getTime()) && date < today;
        }, `${label} must be before today.`);

export const createMemberSchema = z.object({
    first_name: requiredText('First name'),
    middle_name: optionalText('Middle name'),
    last_name: requiredText('Family name'),
    email: z
        .string()
        .trim()
        .min(1, 'Email address is required.')
        .email('Enter a valid email address.'),
    role: z.literal('member'),
    employee_id: requiredText('Member ID'),
    payroll_id: optionalText('Payroll ID'),
    place_of_birth: requiredText('Place of birth'),
    date_of_birth: requiredPastDate('Date of birth'),
    civil_status: z.enum(['single', 'married', 'widowed']),
    sex: z.enum(['male', 'female']),
    educational_attainment: requiredText('Educational attainment'),
    permanent_address: requiredText('Permanent address', 1000),
    permanent_zip_code: requiredText('Permanent address zip code', 20),
    permanent_mobile_number: requiredText('Permanent mobile number', 20),
    present_address: requiredText('Present address', 1000),
    present_zip_code: requiredText('Present address zip code', 20),
    mobile_number: requiredText('Present cellphone number', 20),
    position: requiredText('Position'),
    date_hired: z.string().trim().min(1, 'Date hired is required.'),
    basic_salary: requiredAmount('Income (Gross)', MIN_FINANCIAL_AMOUNT),
    income_type: z.enum(['monthly', 'daily', 'yearly']),
    net_income: requiredAmount('Income (Net)'),
    share_capital_balance: requiredAmount(
        'Share capital balance',
        MIN_FINANCIAL_AMOUNT,
    ),
    other_source_of_income: optionalText('Other source of income'),
    facebook_account_name: optionalText('Facebook account name'),
    spouse_occupation: optionalText('Occupation of spouse'),
    spouse_gross_income: optionalAmount('Spouse income (gross)'),
    spouse_income_type: z.enum(['monthly', 'daily', 'yearly']),
    spouse_net_income: optionalAmount('Spouse income (net)'),
    legal_beneficiaries: z.array(
        z.object({
            full_name: optionalText('Legal beneficiary name', 255),
            relationship: optionalText('Relationship', 255),
        }),
    ),
    real_properties_owned: optionalText('Real properties owned', 2000),
});

type CreateMemberForm = z.infer<typeof createMemberSchema>;
type CreateMemberField = keyof CreateMemberForm;

const initialFormData: CreateMemberForm = {
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    role: 'member',
    employee_id: '',
    payroll_id: '',
    place_of_birth: '',
    date_of_birth: '',
    civil_status: 'single',
    sex: 'male',
    educational_attainment: '',
    permanent_address: '',
    permanent_zip_code: '',
    permanent_mobile_number: '',
    present_address: '',
    present_zip_code: '',
    mobile_number: '',
    position: '',
    date_hired: '',
    basic_salary: '',
    income_type: 'monthly',
    net_income: '',
    share_capital_balance: '',
    other_source_of_income: '',
    facebook_account_name: '',
    spouse_occupation: '',
    spouse_gross_income: '',
    spouse_income_type: 'monthly',
    spouse_net_income: '',
    legal_beneficiaries: [{ full_name: '', relationship: '' }],
    real_properties_owned: '',
};

const civilStatusOptions = [
    { label: 'Single', value: 'single' },
    { label: 'Married', value: 'married' },
    { label: 'Widower/Widow', value: 'widowed' },
] as const;

const sexOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
] as const;

const incomeTypeOptions = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Daily', value: 'daily' },
    { label: 'Yearly', value: 'yearly' },
] as const;

const educationalAttainmentOptions = [
    'Elementary',
    'High School',
    'Vocational',
    'College',
    'Postgraduate',
    'Other',
];

function getZodErrors(error: z.ZodError<CreateMemberForm>) {
    const errors: Partial<Record<CreateMemberField, string>> = {};

    for (const issue of error.issues) {
        const field = issue.path[0];

        if (typeof field === 'string' && !errors[field as CreateMemberField]) {
            errors[field as CreateMemberField] = issue.message;
        }
    }

    return errors;
}

export default function Create() {
    const form = useForm<CreateMemberForm>(initialFormData);
    const { data, setData, post, processing, errors, recentlySuccessful } =
        form;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.clearErrors();

        const result = createMemberSchema.safeParse(data);

        if (!result.success) {
            const clientErrors = getZodErrors(result.error);

            for (const [field, message] of Object.entries(clientErrors)) {
                form.setError(field as CreateMemberField, message);
            }

            toast.error('Please review the highlighted fields.');

            return;
        }

        form.transform(() => result.data);

        post(store.url(), {
            preserveScroll: true,
            onError: () => toast.error('Please review the highlighted fields.'),
        });
    };

    const addBeneficiary = () => {
        const current = data.legal_beneficiaries ?? [];
        form.setData('legal_beneficiaries', [
            ...current,
            { full_name: '', relationship: '' },
        ]);
    };

    const removeBeneficiary = (index: number) => {
        const current = data.legal_beneficiaries ?? [];
        if (current.length <= 1) return;
        const updated = current.filter((_, i) => i !== index);
        form.setData('legal_beneficiaries', updated);
    };

    const updateBeneficiary = (
        index: number,
        field: 'full_name' | 'relationship',
        value: string,
    ) => {
        const current = [...(data.legal_beneficiaries ?? [])];
        current[index] = { ...current[index], [field]: value };
        form.setData('legal_beneficiaries', current);
    };

    const renderTextInput = (
    name: CreateMemberField,
    label: string,
    options: {
        type?: string;
        required?: boolean;
        placeholder?: string;
        min?: number;
        max?: string | number;
        step?: string;
    } = {},
) => (
    <div className="space-y-2">
        <Label htmlFor={name}>
            {label}
            {options.required && <span className="text-red-500"> *</span>}
        </Label>
        <Input
            id={name}
            name={name}
            type={options.type ?? 'text'}
            required={options.required}
            min={options.min}
            max={options.max}
            step={options.step}
            placeholder={options.placeholder}
            value={String(data[name])}
            onChange={(event) => setData(name, event.target.value)}
            className={inputClass}
        />
        <InputError message={errors[name]} />
    </div>
);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const maxHireDate = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1,
).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;


    const renderSelect = <TValue extends string>(
        name: CreateMemberField,
        label: string,
        value: TValue,
        onValueChange: (value: TValue) => void,
        options: ReadonlyArray<{ label: string; value: TValue }>,
        required = true,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={name}>
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger id={name} className={selectClass}>
                    <SelectValue
                        placeholder={`Select ${label.toLowerCase()}`}
                    />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={errors[name]} />
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Create Member" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall
                        title="Create New Member"
                        description="Add a new member to your organization"
                    />
                    <p className="text-sm text-muted-foreground">
                        Fields marked * are required
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-y-2"
                        enterTo="opacity-100 translate-y-0"
                    >
                        <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50 px-6 py-5 shadow-sm">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                                OK
                            </div>
                            <div>
                                <p className="font-semibold text-emerald-800">
                                    Profile Submitted for Validation
                                </p>
                                <p className="text-sm text-emerald-700">
                                    The member profile has been created and is now pending GM approval. The welcome email with credentials will be sent once the General Manager validates and accepts the member.
                                </p>
                            </div>
                        </div>
                    </Transition>

                    <section className={`${sectionClass} space-y-6`}>
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                Account Information
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                The member role is fixed and the temporary
                                password is generated automatically.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {renderTextInput(
                                'last_name',
                                'Name - Family Name',
                                {
                                    required: true,
                                    placeholder: 'Enter family name',
                                },
                            )}
                            {renderTextInput(
                                'first_name',
                                'Name - First Name',
                                {
                                    required: true,
                                    placeholder: 'Enter first name',
                                },
                            )}
                            {renderTextInput(
                                'middle_name',
                                'Name - Middle Name',
                                {
                                    placeholder: 'Enter middle name',
                                },
                            )}
                            {renderTextInput('email', 'Email Address', {
                                type: 'email',
                                required: true,
                                placeholder: 'member@gmail.com',
                            })}
                            {renderTextInput('employee_id', 'Member ID', {
                                required: true,
                                placeholder: 'Enter member ID',
                            })}
                            {renderTextInput('payroll_id', 'Payroll ID', {
                                placeholder: 'Optional payroll identifier',
                            })}

                            <div className="space-y-2">
                                <Label>
                                    Role <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="hidden"
                                    name="role"
                                    value={data.role}
                                />
                                <p className="flex h-10 items-center rounded-lg border border-emerald-100 bg-gray-50 px-3 text-sm font-medium text-muted-foreground">
                                    MEMBER
                                </p>
                                <InputError message={errors.role} />
                            </div>
                        </div>
                    </section>

                    <section className={`${sectionClass} space-y-6`}>
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                Personal Information
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Identity, birth, education, and family details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {renderSelect(
                                'civil_status',
                                'Civil Status',
                                data.civil_status,
                                (value) => setData('civil_status', value),
                                civilStatusOptions,
                            )}
                            {renderSelect(
                                'sex',
                                'Sex',
                                data.sex,
                                (value) => setData('sex', value),
                                sexOptions,
                            )}
                            {renderTextInput(
                                'place_of_birth',
                                'Place of Birth',
                                {
                                    required: true,
                                    placeholder: 'Enter place of birth',
                                },
                            )}
                            {renderTextInput('date_of_birth', 'Date of Birth', {
                                type: 'date',
                                required: true,
                            })}

                            <div className="space-y-2">
                                <Label htmlFor="educational_attainment">
                                    Educational Attainment{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.educational_attainment}
                                    onValueChange={(value) =>
                                        setData('educational_attainment', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="educational_attainment"
                                        className={selectClass}
                                    >
                                        <SelectValue placeholder="Select educational attainment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {educationalAttainmentOptions.map(
                                            (option) => (
                                                <SelectItem
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.educational_attainment}
                                />
                            </div>

                            {renderTextInput(
                                'facebook_account_name',
                                'Facebook Account (Name)',
                                {
                                    placeholder: 'Enter Facebook account name',
                                },
                            )}
                        </div>
                    </section>

                    <section className={`${sectionClass} space-y-6`}>
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                Contact and Address
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Permanent and present address details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {renderTextInput(
                                'permanent_address',
                                'Permanent (Provincial) Address',
                                {
                                    required: true,
                                    placeholder: 'Enter permanent address',
                                },
                            )}
                            {renderTextInput(
                                'permanent_zip_code',
                                'Permanent Address Zip Code',
                                {
                                    required: true,
                                    placeholder: 'Enter zip code',
                                },
                            )}
                            {renderTextInput(
                                'permanent_mobile_number',
                                'Permanent Mobile Number',
                                {
                                    type: 'tel',
                                    required: true,
                                    placeholder: 'Enter mobile number',
                                },
                            )}
                            {renderTextInput(
                                'present_address',
                                'Present Address',
                                {
                                    required: true,
                                    placeholder: 'Enter present address',
                                },
                            )}
                            {renderTextInput(
                                'present_zip_code',
                                'Present Address Zip Code',
                                {
                                    required: true,
                                    placeholder: 'Enter zip code',
                                },
                            )}
                            {renderTextInput(
                                'mobile_number',
                                'Present Cellphone Number',
                                {
                                    type: 'tel',
                                    required: true,
                                    placeholder: 'Enter cellphone number',
                                },
                            )}
                        </div>
                    </section>

                    <section className={`${sectionClass} space-y-6`}>
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                Employment and Income
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Income values are used for loan eligibility
                                checks.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {renderTextInput('position', 'Position', {
                                required: true,
                                placeholder: 'Enter position',
                            })}
                            {renderTextInput('date_hired', 'Date Hired', {
    type: 'date',
    required: true,
    max: maxHireDate,
})}
                            {renderTextInput('basic_salary', 'Income (Gross)', {
                                type: 'number',
                                required: true,
                                min: MIN_FINANCIAL_AMOUNT,
                                step: '0.01',
                                placeholder: '10000.00',
                            })}
                            {renderSelect(
                                'income_type',
                                'Income Type',
                                data.income_type,
                                (value) => setData('income_type', value),
                                incomeTypeOptions,
                            )}
                            {renderTextInput('net_income', 'Income (Net)', {
                                type: 'number',
                                required: true,
                                min: 0,
                                step: '0.01',
                                placeholder: '0.00',
                            })}
                            {renderTextInput(
                                'share_capital_balance',
                                'Share Capital Balance',
                                {
                                    type: 'number',
                                    required: true,
                                    min: MIN_FINANCIAL_AMOUNT,
                                    step: '0.01',
                                    placeholder: '10000.00',
                                },
                            )}
                            {renderTextInput(
                                'other_source_of_income',
                                'Other Source of Income (Specify)',
                                {
                                    placeholder: 'Specify other income source',
                                },
                            )}
                        </div>
                    </section>

                    <section className={`${sectionClass} space-y-6`}>
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                Spouse, Beneficiary, and Assets
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Optional household and property information.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {renderTextInput(
                                'spouse_occupation',
                                'Occupation of Spouse',
                                {
                                    placeholder: 'Enter spouse occupation',
                                },
                            )}
                            {renderTextInput(
                                'spouse_gross_income',
                                'Spouse Income (Gross)',
                                {
                                    type: 'number',
                                    min: 0,
                                    step: '0.01',
                                    placeholder: '0.00',
                                },
                            )}
                            {renderSelect(
                                'spouse_income_type',
                                'Spouse Income Type',
                                data.spouse_income_type,
                                (value) => setData('spouse_income_type', value),
                                incomeTypeOptions,
                                false,
                            )}
                            {renderTextInput(
                                'spouse_net_income',
                                'Spouse Income (Net)',
                                {
                                    type: 'number',
                                    min: 0,
                                    step: '0.01',
                                    placeholder: '0.00',
                                },
                            )}
                            <div className="md:col-span-2 lg:col-span-3 space-y-4">
                                <Label>Legal Beneficiaries</Label>
                                {(data.legal_beneficiaries ?? [{ full_name: '', relationship: '' }]).map((beneficiary, index) => (
                                    <div key={index} className="rounded-lg border border-emerald-100 p-4 bg-emerald-50/50">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-emerald-800">
                                                Legal Beneficiary {index + 1}
                                            </span>
                                            {(data.legal_beneficiaries?.length ?? 1) > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeBeneficiary(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor={`legal-beneficiary-${index}-name`}>
                                                    Full Name
                                                </Label>
                                                <Input
                                                    id={`legal-beneficiary-${index}-name`}
                                                    value={beneficiary.full_name}
                                                    onChange={(e) => updateBeneficiary(index, 'full_name', e.target.value)}
                                                    placeholder="Enter beneficiary name"
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`legal-beneficiary-${index}-relationship`}>
                                                    Relationship
                                                </Label>
                                                <Input
                                                    id={`legal-beneficiary-${index}-relationship`}
                                                    value={beneficiary.relationship}
                                                    onChange={(e) => updateBeneficiary(index, 'relationship', e.target.value)}
                                                    placeholder="e.g., Wife, Daughter, Parent"
                                                    className={inputClass}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(errors.legal_beneficiaries as string | undefined) && (
                                    <p className="text-sm text-red-600">{errors.legal_beneficiaries as string}</p>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addBeneficiary}
                                    className="mt-1"
                                >
                                    Add Beneficiary
                                </Button>
                            </div>

                            <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <Label htmlFor="real_properties_owned">
                                    Real Properties Owned (Specify)
                                </Label>
                                <Textarea
                                    id="real_properties_owned"
                                    name="real_properties_owned"
                                    value={data.real_properties_owned}
                                    onChange={(event) =>
                                        setData(
                                            'real_properties_owned',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Specify real properties owned"
                                    className="min-h-28 rounded-lg border-emerald-100 focus-visible:ring-emerald-500/40"
                                />
                                <InputError
                                    message={errors.real_properties_owned}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col gap-4 border-t border-emerald-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Double-check all information before submitting. The member profile will be submitted for GM validation, and the welcome email with credentials will be sent upon approval.
                        </p>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="min-w-[180px] h-10 font-medium bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                                            Create Member Account
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )
                    }}
                </Form>
            </div>
        </AppLayout>
    );
}
