import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    AlertCircle, 
    User, 
    MapPin, 
    Briefcase, 
    Heart, 
    Camera, 
    Eye, 
    EyeOff 
} from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import member from '@/routes/member';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  
    {
        title: 'User Profile',
        href: member.userProfile.url(),
    },
    
];

interface Beneficiary {
    id?: number;
    full_name: string;
    relationship: string;
    date_of_birth?: string;
}

interface MemberProfile {
    id?: number;
    user_id: number;
    employee_id: string;
    payroll_id?: string | null;
    first_name: string;
    middle_name?: string;
    last_name: string;
    date_of_birth: string;
    sex: string;
    civil_status: string;
    spouse_name?: string;
    mobile_number: string;
    present_address: string;
    permanent_address?: string;
    position: string;
    date_hired: string;
    basic_salary: number;
    share_capital_balance?: number;
    bank_account_number?: string;
    tin_number?: string;
    profile_picture?: string;
}

interface Props {
    memberProfile?: MemberProfile | null;
    beneficiaries: Beneficiary[];
    isNewUser: boolean;
    isAdmin?: boolean;
    profileCompleted: boolean;
    targetUserId?: number;
    targetUserName?: string;
}

export default function UserProfile({ memberProfile, beneficiaries, isNewUser, isAdmin = false, profileCompleted, targetUserId, targetUserName }: Props) {
    const { auth } = usePage<SharedData>().props;
    
    // Determine if this is HR editing another member
    const isHREditingMember = isAdmin && targetUserId;
    
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
    
    // Initialize form data from existing profile or defaults
    const [formData, setFormData] = useState({
        employee_id: memberProfile?.employee_id || '',
        payroll_id: memberProfile?.payroll_id || '',
        first_name: memberProfile?.first_name || '',
        middle_name: memberProfile?.middle_name || '',
        last_name: memberProfile?.last_name || '',
        date_of_birth: memberProfile?.date_of_birth || '',
        sex: memberProfile?.sex || '',
        civil_status: memberProfile?.civil_status || '',
        spouse_name: memberProfile?.spouse_name || '',
        mobile_number: memberProfile?.mobile_number || '',
        present_address: memberProfile?.present_address || '',
        permanent_address: memberProfile?.permanent_address || '',
        position: memberProfile?.position || '',
        date_hired: memberProfile?.date_hired || '',
        basic_salary: memberProfile?.basic_salary || '',
        share_capital_balance: memberProfile?.share_capital_balance || '',
        bank_account_number: memberProfile?.bank_account_number || '',
        tin_number: memberProfile?.tin_number || '',
        profile_picture: memberProfile?.profile_picture || '',
        beneficiaries: beneficiaries.length > 0 ? beneficiaries : [{ full_name: '', relationship: '', date_of_birth: '' }],
    });

    const addBeneficiary = () => {
        setFormData({
            ...formData,
            beneficiaries: [...formData.beneficiaries, { full_name: '', relationship: '', date_of_birth: '' }],
        });
    };

    const removeBeneficiary = (index: number) => {
        const updatedBeneficiaries = formData.beneficiaries.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            beneficiaries: updatedBeneficiaries.length > 0 ? updatedBeneficiaries : [{ full_name: '', relationship: '', date_of_birth: '' }],
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
        'date_hired', 'basic_salary'
    ] : [];

    // Determine if user can edit employment - admins can always edit, members only when isEditing
    const canEditEmployment = isAdmin;

    // Get the appropriate URL for form action
    const formActionUrl = isHREditingMember 
        ? `/dashboards/HR/EditMember/${targetUserId}` 
        : member.userProfile.store.url();

    const formMethod = isHREditingMember ? 'put' : 'post';

    const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};



    const isRequired = (field: string) => requiredFields.includes(field);
    
    return (
    <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
        <Head title="User Profile" />

        {/* Warning Banner for Incomplete Profile */}
        {!profileCompleted && (
            <Card className="border-l-4 border-l-amber-500 bg-amber-50 m-6">
                <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-800">
                                Complete Your Profile First
                            </p>
                            <p className="text-sm text-amber-700">
                                Please complete your profile with all required information before you can apply for a loan or access other member services.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <HeadingSmall
                    title="Personal Information"
                    description={
                        isEditing
                            ? 'You can now edit your profile details'
                            : 'View your personal information'
                    }
                />

                {!isNewUser && (
                    <div className="flex gap-2">
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
                    </div>
                )}
            </div>

            <Form
                method={formMethod}
                action={formActionUrl}
                transform={() => formData as any}
                className="space-y-6"
            >
                {({ processing, recentlySuccessful, errors }) => (
                    <>
                        {/* Identity Section */}
                        <Card className="border-emerald-100">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-emerald-600" />
                                    <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                        Identity
                                    </CardTitle>
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
                                            Employee ID <span className="text-red-500">*</span>
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

                                    {isAdmin && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="payroll_id">Payroll ID</Label>
                                            <Input
                                                id="payroll_id"
                                                name="payroll_id"
                                                value={formData.payroll_id}
                                                onChange={(e) => setFormData({ ...formData, payroll_id: e.target.value })}
                                                placeholder="Optional payroll identifier"
                                                disabled={!isEditing}
                                            />
                                            <InputError message={errors.payroll_id} />
                                        </div>
                                    )}

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
                                            <option value="widowed">Widowed</option>
                                            <option value="separated">Separated</option>
                                        </select>
                                        <InputError message={errors.civil_status} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="spouse_name">Spouse Name</Label>
                                        <Input
                                            id="spouse_name"
                                            name="spouse_name"
                                            value={formData.spouse_name}
                                            onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                                            placeholder="Spouse name (if married)"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.spouse_name} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact & Address Section */}
                        <Card className="border-emerald-100">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-emerald-600" />
                                    <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                        Contact & Address
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="mobile_number">
                                            Mobile Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="mobile_number"
                                            name="mobile_number"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]{11}"
                                            maxLength={11}
                                            minLength={11}
                                            value={formData.mobile_number}
                                            onChange={(e) => {
                                                // Only allow numeric input and limit to 11 characters
                                                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                                setFormData({ ...formData, mobile_number: value });
                                            }}
                                            required={isRequired('mobile_number')}
                                            placeholder="e.g., 09123456789"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.mobile_number} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="tin_number">TIN Number</Label>
                                        <Input
                                            id="tin_number"
                                            name="tin_number"
                                            value={formData.tin_number}
                                            onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                                            placeholder="e.g., 123-456-789"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.tin_number} />
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
                                            rows={3}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.present_address} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="permanent_address">Permanent Address</Label>
                                        <textarea
                                            id="permanent_address"
                                            name="permanent_address"
                                            value={formData.permanent_address}
                                            onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                                            placeholder="Permanent address (optional)"
                                            rows={3}
                                            disabled={!isEditing}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.permanent_address} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employment Section */}
                        <Card className="border-emerald-100">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-emerald-600" />
                                    <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                        Employment Information
                                    </CardTitle>
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
                                        <Label htmlFor="date_hired">
                                            Date Hired <span className="text-red-500">*</span>
                                        </Label>
                                        {!canEditEmployment ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formatDate(formData.date_hired)}
                                            </div>
                                        ) : (
                                            <Input
                                                id="date_hired"
                                                type="date"
                                                name="date_hired"
                                                value={formData.date_hired}
                                                onChange={(e) => setFormData({ ...formData, date_hired: e.target.value })}
                                                required={isRequired('date_hired')}
                                                disabled={!canEditEmployment}
                                            />
                                        )}
                                        <InputError message={errors.date_hired} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="basic_salary">
                                            Basic Salary <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="basic_salary"
                                            name="basic_salary"
                                            type="number"
                                            step="0.01"
                                            value={formData.basic_salary}
                                            onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                                            required={isRequired('basic_salary')}
                                            placeholder="e.g., 50000.00"
                                            disabled={!canEditEmployment}
                                        />
                                        <InputError message={errors.basic_salary} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="share_capital_balance">Share Capital Balance</Label>
                                        <Input
                                            id="share_capital_balance"
                                            name="share_capital_balance"
                                            type="number"
                                            step="0.01"
                                            value={formData.share_capital_balance}
                                            onChange={(e) => setFormData({ ...formData, share_capital_balance: e.target.value })}
                                            placeholder="e.g., 10000.00"
                                            disabled={!canEditEmployment}
                                        />
                                      
                                        <InputError message={errors.share_capital_balance} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="bank_account_number">Bank Account Number (RCBC)</Label>
                                        <Input
                                            id="bank_account_number"
                                            name="bank_account_number"
                                            value={formData.bank_account_number}
                                            onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                                            placeholder="e.g., 1234567890"
                                            disabled={!canEditEmployment}
                                        />
                                         
                                        <InputError message={errors.bank_account_number} />
                                        
                                    </div>
                                    
                                </div>
                                 <p className="text-xs text-muted-foreground p-2">
                                            Note: If you want to add your share capital balance, you should go to the main office.
                                        </p>
                            </CardContent>
                        </Card>

                        {/* Beneficiaries Section */}
                        <Card className="border-emerald-100">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-emerald-600" />
                                    <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                        Beneficiaries
                                    </CardTitle>
                                </div>
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
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {formData.beneficiaries.map((beneficiary, index) => (
                                        <div key={index} className="rounded-lg border border-emerald-100 p-4 bg-emerald-50/50">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium text-emerald-800">Beneficiary {index + 1}</span>
                                                {formData.beneficiaries.length > 1 && (
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
                                            <div className="grid gap-4 md:grid-cols-3">
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
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`beneficiaries[${index}][date_of_birth]`}>
                                                        Date of Birth
                                                    </Label>
                                                    {!isEditing ? (
                                                        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                            {formatDate(beneficiary.date_of_birth)}
                                                        </div>
                                                    ) : (
                                                        <Input
                                                            id={`beneficiaries[${index}][date_of_birth]`}
                                                            name={`beneficiaries[${index}][date_of_birth]`}
                                                            type="date"
                                                            value={beneficiary.date_of_birth}
                                                            disabled={!isEditing}
                                                            onChange={(e) => updateBeneficiary(index, 'date_of_birth', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
